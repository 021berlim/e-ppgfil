# Plano de Integracao Resend - e-PPGFIL

Atualizado em 31/08/2026 para restringir os disparos de e-mail do e-PPGFIL aos quatro cenarios oficiais e incluir a emissao/envio automatico do comprovante de protocolo em PDF.

## Contexto atual do projeto

- O projeto usa Next.js App Router (`app/`) com Route Handlers em `app/api/**/route.ts`; handlers `POST`, `PUT` e `DELETE` executam em tempo de requisicao e sao adequados para chamadas ao Resend, Supabase e Cloudflare R2.
- As variaveis sem prefixo `NEXT_PUBLIC_` ficam somente no servidor. `RESEND_API_KEY`, `RESEND_FROM`, credenciais R2 e `DATABASE_URL` devem permanecer server-only.
- O Supabase ja possui tabelas para usuarios, tokens de redefinicao, protocolos, historico, anexos/documentos R2, grants/logs de acesso e auditoria.
- O Cloudflare R2 ja possui helpers em `lib/r2.ts`: upload pre-assinado, download pre-assinado, `HEAD` e delete.
- O comprovante PDF atual fica em `lib/gerar-comprovante-pdf.ts`, e hoje e client-only: gera o PDF com `jsPDF`, usa `window.location.origin`, cria QR code e chama `doc.save(...)`.
- A criacao e movimentacao de protocolos ainda acontece em `lib/store.ts` via `localStorage`. Para e-mail real, o plano precisa mover criacao e mudancas de status para Route Handlers com persistencia no Supabase antes do envio.
- Ha simulacoes de notificacao no admin (`notificarEmail`) que devem ser substituidas pelos helpers reais quando o fluxo estiver no backend.

Referencias oficiais consultadas:

- Resend Send Email API: aceita `react` no Node SDK e `attachments` com `content` como `buffer` ou Base64, respeitando limite de 40 MB apos Base64.
- Resend Attachments: tambem permite anexar arquivo remoto por `path` e `filename`.
- React Email + Resend: templates podem ser componentes React usados pelo SDK do Resend; a documentacao atual de React Email tambem registra que versoes recentes unificaram componentes/render no pacote `react-email`.

## Escopo exclusivo de disparos

O sistema deve disparar e-mail via Resend somente nestes quatro eventos:

1. **Boas-vindas**
   - Evento: criacao de usuario administrativo no e-PPGFIL.
   - Sem validacao, ativacao ou confirmacao de conta.
   - Origem prevista: `POST /api/admin/users` apos `createDashboardUser(...)` e auditoria do usuario criado.

2. **Comprovante de protocolo criado**
   - Evento: solicitante submete um novo protocolo.
   - Deve ocorrer imediatamente apos persistir o protocolo, seu historico inicial e seus anexos/metadados no Supabase.
   - Deve gerar o comprovante oficial em PDF, salvar no R2, registrar `document_files`, gerar link seguro ou preparar anexo e chamar `sendProtocolReceiptEmail(to, protocolData, pdfUrlOrBuffer)`.
   - Origem prevista: novo `POST /api/protocolos`.

3. **Atualizacao de etapa/tramite do protocolo**
   - Evento: mudanca de `status` ou registro visivel de tramite no historico.
   - Destinatario: criador do protocolo, obtido via `requesters.email`.
   - Conteudo: numero do protocolo, etapa anterior, nova etapa e parecer/observacoes.
   - Origem prevista: novos Route Handlers de protocolo, por exemplo `PATCH /api/protocolos/[id]/status` e/ou `POST /api/protocolos/[id]/historico`, chamados pelo Kanban e tela de detalhes.

4. **Redefinicao de senha**
   - Evento: solicitacao de recuperacao de conta.
   - Conteudo: link com token temporario e prazo de expiracao.
   - Origem prevista: novos `POST /api/auth/password-reset/request` e `POST /api/auth/password-reset/confirm`, usando `password_reset_tokens`.

Fora desses eventos, nao disparar e-mails pelo Resend. Em especial: nao enviar ativacao de conta, confirmacao de e-mail, newsletter, marketing, lembrete generico, arquivamento automatico ou notificacao interna.

## Dependencias e configuracao

Adicionar dependencias:

```bash
pnpm add resend @react-email/components
```

Se a versao instalada do React Email for 6.x ou superior, preferir imports do pacote `react-email` por compatibilidade com a documentacao atual. Se a exigencia do projeto for manter `@react-email/components`, fixar versao compativel e documentar essa escolha no `package.json`.

Variaveis de ambiente server-only:

```env
RESEND_API_KEY=re_...
RESEND_FROM="e-PPGFIL <noreply@seudominio>"
RESEND_REPLY_TO=posfil@gmail.com
APP_BASE_URL=https://...
PROTOCOL_RECEIPT_PDF_TTL_SECONDS=604800
PROTOCOL_RECEIPT_DELIVERY_MODE=link
```

`PROTOCOL_RECEIPT_DELIVERY_MODE` aceita:

- `link`: recomendado; salva PDF no R2 e envia botao com URL segura.
- `attachment`: alternativo; envia buffer/Base64 no `attachments`.

## Estrutura proposta de arquivos

```txt
emails/
  components.tsx
  welcome-email.tsx
  protocol-receipt-email.tsx
  protocol-status-update-email.tsx
  password-reset-email.tsx

lib/
  email/
    resend.ts
    senders.ts
    types.ts
  protocol-receipt-pdf.ts
  protocol-receipt-storage.ts

app/api/
  protocolos/route.ts
  protocolos/[id]/status/route.ts
  protocolos/[id]/historico/route.ts
  auth/password-reset/request/route.ts
  auth/password-reset/confirm/route.ts
```

## Templates React Email

Todos os templates devem receber dados ja sanitizados/formatados pelo backend e manter texto simples equivalente para acessibilidade e fallback.

### Template 1 - Boas-vindas

Arquivo: `emails/welcome-email.tsx`

Props:

```ts
type WelcomeEmailProps = {
  userName: string
  loginUrl: string
}
```

Conteudo:

- Saudacao com nome.
- Informar que a conta administrativa foi criada.
- Botao para acessar o painel.
- Aviso de que nao ha fluxo de ativacao/validacao.

### Template 2 - Comprovante de novo protocolo

Arquivo: `emails/protocol-receipt-email.tsx`

Props:

```ts
type ProtocolReceiptEmailProps = {
  requesterName: string
  protocolNumber: string
  createdAt: string
  categoryName: string
  requestTypeName: string
  summary: string
  status: string
  consultationUrl: string
  receiptPdfUrl?: string
  receiptAttached?: boolean
  attachmentsSummary: Array<{ filename: string; sizeLabel: string }>
}
```

Conteudo:

- Numero do protocolo em destaque.
- Dados da solicitacao: categoria, tipo, data/hora, status inicial, resumo e anexos informados.
- Botao "Baixar comprovante em PDF" quando `receiptPdfUrl` existir.
- Texto alternativo informando que o comprovante segue anexado quando `receiptAttached` for verdadeiro.
- Link para consulta publica do protocolo.

### Template 3 - Atualizacao de etapa

Arquivo: `emails/protocol-status-update-email.tsx`

Props:

```ts
type ProtocolStatusUpdateEmailProps = {
  requesterName: string
  protocolNumber: string
  previousStatus: string
  currentStatus: string
  observation: string
  updatedAt: string
  consultationUrl: string
}
```

Conteudo:

- Numero do protocolo.
- Etapa anterior e nova etapa.
- Parecer/observacoes visiveis ao solicitante.
- Botao para acompanhar no e-PPGFIL.

### Template 4 - Redefinicao de senha

Arquivo: `emails/password-reset-email.tsx`

Props:

```ts
type PasswordResetEmailProps = {
  userName: string
  resetUrl: string
  expiresAt: string
}
```

Conteudo:

- Botao para redefinir senha.
- Prazo de expiracao.
- Aviso para ignorar se a pessoa nao solicitou a recuperacao.

## SDK Resend e helpers

Criar `lib/email/resend.ts`:

```ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export function getEmailFrom() {
  const from = process.env.RESEND_FROM
  if (!from) throw new Error('RESEND_FROM nao configurada.')
  return from
}
```

Criar `lib/email/senders.ts` com helpers:

```ts
export async function sendWelcomeEmail(to: string, user: WelcomeEmailData) {}

export async function sendProtocolReceiptEmail(
  to: string,
  protocolData: ProtocolReceiptEmailData,
  pdf: { mode: 'link'; url: string } | { mode: 'attachment'; filename: string; content: Buffer },
) {}

export async function sendProtocolStatusUpdateEmail(
  to: string,
  data: ProtocolStatusUpdateEmailData,
) {}

export async function sendPasswordResetEmail(to: string, data: PasswordResetEmailData) {}
```

`sendProtocolReceiptEmail` deve montar:

- `react: <ProtocolReceiptEmail ... />`.
- `subject: "[e-PPGFIL] Protocolo {numero} registrado"`.
- `attachments` apenas quando `pdf.mode === 'attachment'`.
- Sem CC/BCC por padrao.
- `replyTo` com `RESEND_REPLY_TO`, se configurado.

Falhas de envio:

- Nao desfazer a criacao do protocolo se o e-mail falhar.
- Registrar erro em auditoria/log operacional.
- Retornar ao frontend uma mensagem clara: protocolo criado, mas envio do comprovante pendente.
- Preparar campo de reprocessamento futuro via tabela de log/outbox.

## Estrategia de comprovante PDF

### Refatorar geracao do PDF

Separar a construcao do documento da acao de download:

- `lib/protocol-receipt-pdf.ts`: funcao server-safe `generateProtocolReceiptPdfBuffer(protocol, options): Promise<Buffer>`.
- `lib/gerar-comprovante-pdf.ts`: manter wrapper client-only para `doc.save(...)` chamando a mesma logica ou um adaptador equivalente.

O builder server-safe nao deve depender de `window`. Usar `APP_BASE_URL` para montar a URL de consulta e QR code.

### Opcao A - Anexo no e-mail

Fluxo:

1. Gerar `Buffer` do PDF no backend.
2. Chamar Resend com:

```ts
attachments: [
  {
    filename: `protocolo-${safeProtocolNumber}.pdf`,
    content: pdfBuffer,
  },
]
```

Uso recomendado somente quando:

- PDF ficar pequeno o suficiente para o limite de 40 MB apos Base64.
- A secretaria quiser garantir que o comprovante esteja autocontido no e-mail.

Riscos:

- Mensagens mais pesadas.
- Maior chance de bloqueio por provedores.
- Consome mais payload do Resend.

### Opcao B - Link seguro no corpo do e-mail (recomendado)

Fluxo:

1. Gerar `Buffer` do PDF.
2. Salvar no R2 em chave previsivel e nao publica, por exemplo:

```txt
protocol-receipts/{ano}/{protocolId}/comprovante.pdf
```

3. Inserir metadados em `document_files` com `protocol_id`, `owner_requester_id`, `r2_bucket`, `r2_key`, `original_filename`, `mime_type = 'application/pdf'`, `size_bytes`, `status = 'available'`, `is_public = false`.
4. Criar grant/token de download para o solicitante ou usar a rota existente de download com token.
5. Gerar URL direta:
   - Preferencia operacional: URL do app (`/api/documents/{id}/download?token=...`) que devolve uma Presigned URL curta do R2.
   - Alternativa: Presigned URL do R2 ja no e-mail, com TTL maior configurado por `PROTOCOL_RECEIPT_PDF_TTL_SECONDS`.
6. Enviar e-mail com botao `receiptPdfUrl`.

Recomendacao: enviar link do app, nao a Presigned URL bruta do R2, para manter auditoria, permitir revogacao/troca de TTL e evitar links expirados impressos no corpo do e-mail. A rota do app pode gerar Presigned URL R2 sob demanda.

## Sequencia do novo protocolo

Novo `POST /api/protocolos`:

1. Validar payload: CPF, nome completo, e-mail, categoria, tipo, resumo e anexos finalizados.
2. Abrir transacao no Supabase.
3. Upsert em `requesters` por CPF, atualizando nome/e-mail.
4. Inserir `protocols` e deixar `number` ser gerado por `next_protocol_number()`.
5. Inserir `protocol_history` inicial com origem `solicitante`, status `Gerado` e mensagem oficial.
6. Vincular anexos ja enviados no R2 atualizando `document_files.protocol_id`, `protocol_history_id` e `owner_requester_id`.
7. Commit da transacao.
8. Gerar PDF do comprovante com os dados persistidos.
9. Salvar PDF no R2 e registrar metadados em `document_files`.
10. Gerar link seguro de download.
11. Enviar `sendProtocolReceiptEmail(...)`.
12. Registrar auditoria: protocolo criado, comprovante PDF criado, e-mail solicitado/enviado ou falho.
13. Retornar ao frontend: protocolo, numero, status do e-mail e link de download quando permitido.

Ponto de consistencia: se a criacao do PDF ou envio do e-mail falhar, o protocolo permanece criado. O erro fica registrado e pode ser reprocessado.

## Sequencia de atualizacao de status/tramite

Novo `PATCH /api/protocolos/[id]/status`:

1. Exigir permissao administrativa.
2. Buscar protocolo atual, requester e status anterior.
3. Validar nova etapa.
4. Atualizar `protocols.status`, limpar `requirement_substage` quando aplicavel.
5. Inserir `protocol_history` visivel ao solicitante com parecer/observacao.
6. Commit.
7. Enviar `sendProtocolStatusUpdateEmail(...)` para `requesters.email`.
8. Registrar auditoria e resultado do envio.

Para entradas manuais visiveis sem mudanca de status, `POST /api/protocolos/[id]/historico` pode chamar o mesmo template quando `visible_to_requester = true` e o evento representar tramite comunicado ao solicitante.

## Sequencia de boas-vindas

Atualizar `POST /api/admin/users`:

1. Criar usuario com `createDashboardUser(payload)`.
2. Registrar auditoria `usuario_criado`.
3. Enviar `sendWelcomeEmail(row.email, { userName: row.name, loginUrl })`.
4. Retornar usuario criado e `emailStatus`.

Nao criar token de ativacao e nao bloquear login aguardando confirmacao.

## Sequencia de redefinicao de senha

Novo `POST /api/auth/password-reset/request`:

1. Receber e-mail.
2. Sempre responder mensagem neutra para evitar enumeracao.
3. Se usuario ativo existir, criar token aleatorio, salvar hash em `password_reset_tokens`, definir expiracao curta.
4. Enviar `sendPasswordResetEmail(...)` com URL temporaria.
5. Auditar solicitacao.

Novo `POST /api/auth/password-reset/confirm`:

1. Validar token por hash, expiracao e `used_at`.
2. Atualizar `users.password_hash`.
3. Marcar token como usado e revogar sessoes antigas se desejado.
4. Auditar redefinicao concluida.

## Dados e auditoria recomendados

Adicionar uma tabela de log/outbox para rastrear entregas:

```sql
CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(80) NOT NULL CHECK (event_type IN (
    'welcome',
    'protocol_receipt',
    'protocol_status_update',
    'password_reset'
  )),
  recipient_email citext NOT NULL,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resend_email_id text,
  status varchar(40) NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
```

O MVP pode fazer envio sincrono no Route Handler apos commit. Para producao mais robusta, gravar `pending` e processar em job/cron, preservando idempotencia por `event_type + protocol_id + status/transicao`.

## Ajustes no frontend

- `app/solicitacao/solicitacao-form.tsx`: trocar `criarProtocolo(...)` local por `fetch('/api/protocolos', { method: 'POST' })`.
- `hooks/use-protocolos.ts`: buscar protocolos no backend em vez de `localStorage`, mantendo estado local apenas como cache de UI.
- `app/admin/protocolos/kanban-board.tsx` e `app/admin/protocolos/protocolo-modal.tsx`: trocar `moverStatus`, `adicionarEntradaManual` e chamadas simuladas de `notificarEmail` por Route Handlers reais.
- Manter o botao "Baixar comprovante PDF" usando o link retornado pelo backend quando houver PDF no R2; o gerador client-side pode continuar como fallback temporario ate a migracao completa.

## Testes e validacao

- Unitarios para helpers de e-mail verificando assunto, destinatario, template e `attachments`.
- Unitarios para geracao do PDF server-side garantindo `Buffer`, nome seguro de arquivo e URL de consulta sem CPF.
- Teste de integracao do `POST /api/protocolos` com Resend mockado:
  - persiste protocolo;
  - gera historico inicial;
  - grava comprovante;
  - chama `sendProtocolReceiptEmail`;
  - retorna protocolo mesmo quando envio falha.
- Teste de status update garantindo envio somente ao criador do protocolo.
- Teste de password reset garantindo resposta neutra e token expiravel.
- Smoke em Vercel Preview com dominio Resend em modo teste/ambiente homologado.

## Ordem de implementacao sugerida

1. Instalar dependencias e configurar variaveis Resend.
2. Criar templates React Email e helpers `lib/email`.
3. Refatorar PDF para gerar `Buffer` no servidor e manter download client-side.
4. Criar storage helper para comprovante no R2.
5. Implementar `POST /api/protocolos` e migrar formulario publico.
6. Implementar envio do comprovante com `PROTOCOL_RECEIPT_DELIVERY_MODE=link`.
7. Migrar mudancas de status/tramite para Route Handlers e ativar e-mail de atualizacao.
8. Ativar boas-vindas em `POST /api/admin/users`.
9. Implementar recuperacao de senha.
10. Adicionar tabela/log de entregas, testes e documentar operacao.

## Criterios de aceite

- Apenas os quatro cenarios oficiais chamam o Resend.
- Novo protocolo gera numero, historico inicial, PDF oficial e e-mail de comprovante automaticamente.
- O e-mail de comprovante inclui resumo do envio e PDF por link seguro recomendado ou anexo configuravel.
- Mudanca de etapa/tramite envia e-mail ao criador do protocolo com etapa anterior, nova etapa e observacao.
- Criacao de usuario envia boas-vindas sem ativacao de conta.
- Recuperacao de senha envia link temporario e nao revela se o e-mail existe.
- Segredos permanecem server-only.
- Falha de e-mail nao apaga protocolo nem interrompe auditoria.
