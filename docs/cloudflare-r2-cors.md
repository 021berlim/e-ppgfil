# Cloudflare R2 CORS

O upload de documentos usa URL pre-assinada e faz `PUT` direto do navegador para o bucket R2. Mesmo com a URL pre-assinada correta, o navegador bloqueia a requisicao se o bucket nao tiver CORS permitindo a origem do sistema.

Politica sugerida para desenvolvimento e producao:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://SEU-DOMINIO-DE-PRODUCAO"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

No dashboard da Cloudflare:

1. Abra R2 Object Storage.
2. Selecione o bucket usado em `R2_BUCKET_NAME`.
3. Entre em Settings.
4. Em CORS Policy, adicione a politica JSON acima.
5. Troque `https://SEU-DOMINIO-DE-PRODUCAO` pela origem exata do sistema, sem barra no final.

Tambem e possivel aplicar via Wrangler:

```bash
npx wrangler r2 bucket cors set <BUCKET_NAME> --file cors.json
npx wrangler r2 bucket cors list <BUCKET_NAME>
```

Observacoes importantes:

- `AllowedOrigins` precisa bater exatamente com a origem do navegador, por exemplo `http://localhost:3000` ou `https://app.exemplo.com`.
- `AllowedMethods` precisa incluir `PUT`, porque o frontend envia o arquivo com esse metodo.
- `AllowedHeaders` precisa incluir `Content-Type`, porque o frontend envia esse header no `PUT`.
- Alteracoes de CORS podem levar alguns segundos para propagar.
