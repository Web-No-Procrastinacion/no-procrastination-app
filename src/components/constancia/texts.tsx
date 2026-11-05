import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const AVISO_TEXTO =
  "Esta aplicación es un acompañamiento motivacional para organizar tus actividades. No ofrece diagnóstico ni tratamiento y no reemplaza la terapia cognitivo-conductual (TCC) ni la atención de un profesional de la salud. Si sientes que la procrastinación o tu estado de ánimo te están afectando, busca apoyo en el servicio de bienestar de tu universidad o con un profesional.";

export function Aviso({ title = "Aviso importante" }: { title?: string }) {
  return (
    <aside
      className="info-surface flex gap-3 rounded-2xl p-4"
      aria-label={title}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-base leading-relaxed">{AVISO_TEXTO}</p>
      </div>
    </aside>
  );
}

export function PolicyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl bg-card">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="font-display text-xl">
            Política de tratamiento de datos personales
          </DialogTitle>
          <DialogDescription>Texto de ejemplo para el prototipo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-base leading-relaxed">
          <p>
            En cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, AKTIVA trata
            tus datos personales (nombre, correo y la información de tus tareas, hábitos y
            objetivos) únicamente para prestarte el servicio de acompañamiento.
          </p>
          <p>
            Tus datos no se venden ni se comparten con terceros. Puedes conocer, actualizar,
            rectificar y solicitar la eliminación de tu información en cualquier momento.
          </p>
          <p>
            En este prototipo, la información se guarda solo en tu navegador y no se guarda ninguna
            contraseña.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
