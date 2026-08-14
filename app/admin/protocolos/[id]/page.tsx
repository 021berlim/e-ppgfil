import { DetalhesProtocoloPage } from './protocolo-detalhes-page'

export const metadata = {
  title: 'Detalhes do protocolo | e-PPGFIL',
}

export default async function ProtocoloPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DetalhesProtocoloPage id={id} />
}
