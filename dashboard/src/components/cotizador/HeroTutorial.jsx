'use client'
import { Calculator, DollarSign, TrendingUp, FileText } from 'lucide-react'
import TutorialSection from '../ui/TutorialSection'

export default function HeroTutorial() {
  const steps = [
    {
      icon: Calculator,
      title: "Ingresa el precio",
      description: "Precio de pantalla + fees de emisión y agencia"
    },
    {
      icon: DollarSign,
      title: "Selecciona monedas",
      description: "Moneda del precio y moneda para cotizar"
    },
    {
      icon: TrendingUp,
      title: "Configura vuelo",
      description: "Tipo, fechas, equipaje y método de pago"
    },
    {
      icon: FileText,
      title: "Calcula y exporta",
      description: "Obtén el resultado y genera PDF"
    }
  ]

  return (
    <TutorialSection
      title="¿Cómo usar la calculadora?"
      subtitle="Sigue estos 4 pasos simples para cotizar rápidamente"
      steps={steps}
      defaultExpanded={false}
    />
  )
}
