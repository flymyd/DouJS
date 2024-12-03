# 构建前端
FROM node:20-alpine as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
ARG SERVER_ADDR
ARG SERVER_PORT
ENV VITE_SERVER_ADDR=$SERVER_ADDR
ENV VITE_SERVER_PORT=$SERVER_PORT
RUN npm run build

# 构建后端
FROM node:20-alpine
# 安装 nginx
RUN apk add --no-cache nginx

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 复制前端构建结果
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

# 设置环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0

# 创建启动脚本
RUN echo "#!/bin/sh\nnginx\nnpm start" > /start.sh && chmod +x /start.sh

# 暴露端口
EXPOSE 80 $SERVER_PORT

# 启动命令
CMD ["/start.sh"] 