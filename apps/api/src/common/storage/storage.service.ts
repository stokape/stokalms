// ============================================================================
// storage.service.ts — Cliente de almacenamiento de archivos, compatible con
// la API de S3 (MinIO en local, Cloudflare R2/AWS S3 en produccion — ver
// docker-compose.yml y .env.example, seccion "STORAGE_*").
//
// Este es el PRIMER consumidor de este servicio (los PDF de certificados,
// ver certificate.service.ts), pero se deja como modulo GLOBAL de
// "common/" (no dentro de modules/certificates/) porque cualquier modulo
// futuro que suba archivos (recursos de leccion, paquetes SCORM, avatares)
// va a necesitar exactamente el mismo cliente configurado igual — el mismo
// razonamiento que ya se aplico con TenantModule (ver tenant.module.ts).
// ============================================================================

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/configuration';
import { verifyMagicBytes } from './file-validation';

// Mimetypes que es SEGURO dejar que el navegador renderice inline (nunca
// forzar descarga): imágenes, video, PDF — formatos sin capacidad de
// ejecutar script al abrirse. Cualquier otro tipo (incluido el comodín
// "doc" de inferResourceType para lo no reconocido) se descarga siempre,
// nunca se renderiza inline — ver getPresignedDownloadUrl más abajo, parte
// de la mitigación de la auditoría de seguridad F-03.
const SAFE_TO_RENDER_INLINE = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
  'application/pdf',
];

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  // Memoiza la verificacion/creacion del bucket para no repetirla en cada
  // subida — ver ensureBucketExists() mas abajo.
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    const storageConfig = this.configService.get<AppConfig['storage']>('storage')!;
    this.bucket = storageConfig.bucket;

    this.client = new S3Client({
      endpoint: storageConfig.endpoint,
      region: storageConfig.region,
      // MinIO necesita direcciones "path-style" (http://host/bucket/key) en
      // vez del "virtual-hosted-style" que usa S3 real por defecto
      // (http://bucket.host/key) — ver STORAGE_FORCE_PATH_STYLE en
      // .env.example. En produccion contra R2/S3 esto queda en "false".
      forcePathStyle: storageConfig.forcePathStyle,
      credentials: {
        accessKeyId: storageConfig.accessKey,
        secretAccessKey: storageConfig.secretKey,
      },
    });
  }

  // Sube un archivo y devuelve la KEY (ruta dentro del bucket) con la que
  // despues se puede volver a pedir — NO devuelve una URL: el bucket no es
  // publico, asi que la unica forma valida de descargar algo es pidiendo una
  // URL firmada de corta duracion (ver getPresignedDownloadUrl).
  //
  // "verifyMagicBytes" corre SIEMPRE aca, sin importar quien llame a
  // upload() — es la unica forma de garantizar que NINGUN endpoint futuro
  // de subida (los 4 actuales u otro que se agregue despues) pueda saltearse
  // la verificacion de contenido por olvido (ver auditoria de seguridad,
  // hallazgo F-03/SECURITY-03: antes cada controller confiaba en el
  // Content-Type que el propio cliente declaraba, sin verificar nada).
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    verifyMagicBytes(body, contentType);
    await this.ensureBucketExists();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  // Genera una URL temporal (por defecto, 1 hora) que permite descargar el
  // objeto SIN credenciales — es lo que se le entrega al frontend o a quien
  // consulta el endpoint publico de verificacion de certificados
  // (ver verify.service.ts) para que pueda ver/descargar el PDF sin que el
  // bucket entero tenga que ser publico.
  //
  // "contentType" (opcional): cuando se conoce, decide si la URL fuerza
  // descarga o permite que el navegador la renderice inline (ver
  // SAFE_TO_RENDER_INLINE arriba) — un recurso subido como "video/mp4"
  // puede reproducirse en la pantalla del curso, pero cualquier tipo fuera
  // de esa lista blanca (incluido el mimetype declarado con datos falsos:
  // el CONTENIDO ya fue verificado al subir, pero rendirizar inline es una
  // segunda capa de defensa, no solo una comodidad) siempre se descarga —
  // asi el navegador nunca interpreta un archivo dudoso como HTML/SVG
  // ejecutable solo por abrirlo en una pestaña nueva.
  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
    contentType?: string,
  ): Promise<string> {
    const forceDownload = !contentType || !SAFE_TO_RENDER_INLINE.includes(contentType);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(forceDownload && { ResponseContentDisposition: 'attachment' }),
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  // A diferencia de setup-keycloak.js (que es un script aparte que se corre
  // a mano una vez), crear el bucket no necesita ningun dato que no tengamos
  // ya en tiempo de ejecucion (solo el nombre, que viene de config) — por
  // eso aqui se resuelve solo, la primera vez que hace falta, en vez de
  // exigir un paso manual mas en el README. Es idempotente: si el bucket ya
  // existe, HeadBucket no lanza error y no se intenta crear de nuevo.
  private async ensureBucketExists(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = this.client
        .send(new HeadBucketCommand({ Bucket: this.bucket }))
        .catch(() => this.client.send(new CreateBucketCommand({ Bucket: this.bucket })))
        .then(() => undefined);
    }
    await this.bucketReady;
  }
}
