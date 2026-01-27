import { useEffect, useState } from "react";

export const useFetch = (url, options = {}) => {
  const {
    dataKey = null,
    successKey = null,
    messageKey = null,
    transform = null,
  } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();

        // 1️⃣ Validar éxito si existe successKey
        if (successKey && !result[successKey]) {
          const errorMessage =
            result[messageKey] || "La solicitud no fue exitosa";
          throw new Error(errorMessage);
        }

        // 2️⃣ Extraer datos si existe dataKey
        let extractedData = dataKey ? result[dataKey] : result;

        // 3️⃣ Aplicar transformación personalizada si existe
        const finalData = transform ? transform(extractedData, result) : extractedData;

        setData(finalData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, refetchTrigger, dataKey, successKey, messageKey, transform]);

  // ¿Qué retornamos?
  return { data, loading, error, refetch };
};

// ejemplo de uso con transform 
/*  const miTransform = useCallback((datosExtraidos, respuestaCompleta) => {
  // 1️⃣ Validación básica de éxito (ajusta según tu API)
  if (!respuestaCompleta.success && respuestaCompleta.success !== true) {
    const mensaje = respuestaCompleta.message || respuestaCompleta.error || "Error desconocido";
    throw new Error(mensaje);
  }

  // 2️⃣ Extrae el campo que necesitas (ajusta el nombre: "data", "usuarios", "items", etc.)
  const datos = respuestaCompleta.usuarios; // 👈 CAMBIA "usuarios" POR TU CLAVE

  // 3️⃣ (Opcional) Modifica los datos si necesitas
  // Ejemplo: convertir nombres a mayúsculas
  // const datosModificados = datos.map(usuario => ({
  //   ...usuario,
  //   nombre: usuario.nombre?.toUpperCase()
  // }));
  // return datosModificados;

  // 4️⃣ Devuelve los datos tal cual (o modificados)
  return datos; // ✅ puede ser array u objeto
}, []); // ← dependencias vacías (a menos que uses props/estado)  */