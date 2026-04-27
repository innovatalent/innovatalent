FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

# Copy application code
COPY server/ ./server/
COPY client/ ./client/

# Create uploads directory
RUN mkdir -p /app/uploads

# Non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

CMD ["node", "server/src/index.js"]
