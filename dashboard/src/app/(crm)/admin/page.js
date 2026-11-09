import { redirect } from 'next/navigation';

// El panel del análisis automático anterior se retiró: la auditoría continua vive en el Centro IA.
export default function Page() {
  redirect('/inteligencia');
}
