export const servicios = [
  { id: 1, nombre: "Baño + Corte" },
  { id: 2, nombre: "Baño" },
  { id: 3, nombre: "Corte higiénico" },
];

export function proximosDias(n = 12) {
  const arr = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    arr.push({ label, iso });
  }
  return arr;
}

export const horariosDefault = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];

/*Perros fotos*/
export const galeriaPerros = [
  {
    id: 1,
    nombre: "Milo",
    desc: "Baño + corte. Quedó súper prolijo.",
  },
  {
    id: 2,
    nombre: "Luna",
    desc: "Deslanado y perfumito. Una reina.",
  },
  {
    id: 3,
    nombre: "Rocky",
    desc: "Corte higiénico + uñas.",
  },
  {
    id: 4,
    nombre: "Nala",
    desc: "Baño completo. Suave y brillante.",
  },
  {
    id: 5,
    nombre: "Toby",
    desc: "Corte completo. Cambio total.",
  },
  {
    id: 6,
    nombre: "Kiara",
    desc: "Baño + retoque final.",
  },
];


