# cijianai.com 本机上线

本机作为源站，Caddy 监听公网 80/443，反向代理到 Next.js `127.0.0.1:3000`。

当前网络信息（`2026-11-02` 检查）：

```text
公网 IPv4:  101.90.35.100
内网 IPv4:  10.51.122.100
默认网关:   10.51.122.1
域名 DNS:   阿里云万网 dns13/dns14.hichina.com
```

> 公网 IP 可能是动态的；请在路由器 WAN 状态页确认它确实是 `101.90.35.100`。如果路由器 WAN 不是这个地址，说明处于运营商 NAT 后面，端口映射不可用，需要改用 Cloudflare Tunnel 或公网服务器。

## 1. 阿里云 DNS

在阿里云 DNS 控制台为 `cijianai.com` 添加：

```text
记录类型   主机记录   记录值
A          @          101.90.35.100
CNAME      www        cijianai.com
```

TTL 用 600 秒。等 `nslookup cijianai.com` 能返回 `101.90.35.100` 后再继续。

## 2. 路由器端口映射

在路由器管理页把以下 TCP 端口转发到本机：

```text
公网 80  -> 10.51.122.100:80
公网 443 -> 10.51.122.100:443
```

给本机设置 DHCP 静态租约，避免内网 IP 变化导致映射失效。

## 3. Windows 防火墙

以**管理员身份**打开 PowerShell，在项目目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\allow-firewall.ps1
```

或者手动执行：

```powershell
New-NetFirewallRule -DisplayName "Caddy HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Caddy HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -Profile Any
```

不要把 `3000` 端口暴露到公网。

## 4. Caddy

已验证配置：

```powershell
C:\Users\Gu\AppData\Local\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe validate --config .\deploy\Caddyfile --adapter caddyfile
```

启动：

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" start --config "C:\work\cijian\deploy\Caddyfile" --adapter caddyfile
```

Caddy 会自动申请 Let's Encrypt 证书。DNS 尚未生效时日志会报：

```text
no valid A records found for cijianai.com
```

DNS 生效后重启 Caddy 即可：

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" stop
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" start --config "C:\work\cijian\deploy\Caddyfile" --adapter caddyfile
```

验证：

```powershell
curl.exe -I https://cijianai.com
```

## 5. 应用环境

域名 HTTPS 生效后，把 `.env.local` 的 `APP_URL` 改成：

```env
APP_URL=https://cijianai.com
```

然后重启 Next.js：

```powershell
cd C:\work\cijian
pnpm start
```

## 6. 中国大陆服务器注意

如果这台机器在中国大陆，`cijianai.com` 解析到大陆 IP 并提供 80/443 服务，需要完成 **ICP 备案**。未备案时运营商会拦截 80/443，Caddy 也会申请证书失败。香港/海外服务器不需要备案。

## 当前架构

```text
Internet
  ↓ :80/:443
Caddy (本机 35860)
  ↓ 127.0.0.1:3000
Next.js
  ↓
.data/pglite
```

这是单机演示/小流量结构；高并发仍应迁移到 Linux + PostgreSQL + Redis + Docker/K8s。
