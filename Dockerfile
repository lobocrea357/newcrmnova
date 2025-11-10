# Dockerfile para el servidor Express
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código fuente
COPY src ./src

# Exponer el puerto
EXPOSE 4000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]
