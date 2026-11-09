import { redirect } from 'next/navigation';

// Ruta antigua: ahora vive en el Centro IA.
export default function Page() {
  redirect('/inteligencia/reportes');
}
