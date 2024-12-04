# 构建前端
FROM node:20-alpine3.19 as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install
COPY client/ ./
ARG SERVER_ADDR
ARG SERVER_PORT
ENV VITE_SERVER_ADDR=$SERVER_ADDR
ENV VITE_SERVER_PORT=$SERVER_PORT
RUN npm run build

# 构建后端
FROM node:20-alpine3.19
# 安装 nginx 和构建依赖
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main/" > /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/v3.18/community/" >> /etc/apk/repositories
RUN apk update
RUN apk add --no-cache nginx python3 python3-dev py3-pip make g++ gcc supervisor

WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
# 设置 python 路径
ENV PYTHON=/usr/bin/python3
# 安装 python 依赖
RUN pip3 install setuptools
RUN npm install
COPY . .
# 复制前端构建结果
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

# 设置环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0

# nginx配置
RUN mkdir -p /run/nginx
RUN rm -f /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/nginx.conf

# 创建supervisor配置
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80 11451

# 启动命令
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 