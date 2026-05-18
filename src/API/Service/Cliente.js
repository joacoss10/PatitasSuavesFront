import { apiFetch } from "../Config/ApiClient";

export async function obtenerTurnosCliente(estadoTurno) {
  try {
    const response = await apiFetch(`/me/turnos?estadoTurno=${estadoTurno}`, {
      method: "GET",
    });
    return response;
  } catch (err) {
    throw new Error(err.message || "Error al obtener turnos");
  }
}

export async function cancelarTurno(idTurno) {
  try {
    const response = await apiFetch(`/turno/cancelarTurno?idTurno=${idTurno}`, {
      method: "POST",
    });
    return response;
  } catch (err) {
    throw new Error(err.message || "Error al cancelar turno");
  }
}