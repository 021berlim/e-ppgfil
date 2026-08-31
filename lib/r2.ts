import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} nao configurada.`)
  return value
}

export function getR2Bucket() {
  return requiredEnv('R2_BUCKET_NAME')
}

let r2Client: S3Client | null = null

function getR2Client() {
  r2Client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${requiredEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
  return r2Client
}

export async function createPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 300,
}: {
  key: string
  contentType: string
  expiresIn?: number
}) {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  )
}

export async function createPresignedDownloadUrl(key: string, expiresIn = 300) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
    { expiresIn },
  )
}

export async function putR2Object({
  key,
  body,
  contentType,
}: {
  key: string
  body: Buffer | Uint8Array | string
  contentType: string
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function headR2Object(key: string) {
  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  )
}

export async function deleteR2Object(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    }),
  )
}
