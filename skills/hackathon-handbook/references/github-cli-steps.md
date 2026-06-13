# GitHub 命令行版（给愿意学命令行的新人）

图形界面（GitHub Desktop）已经够用。这份给想用命令行的人，逐行解释每条命令在干嘛。

## 一次性准备

1. 注册 github.com 账号。
2. 装 Git：macOS 在终端输 `git --version`，没装会提示安装；Windows 去 git-scm.com 下载。
3. 配置身份（只需做一次）：
   ```bash
   git config --global user.name "你的名字"
   git config --global user.email "你的邮箱"
   ```

## 把项目推上去

在项目文件夹里依次执行，每行作用见注释：

```bash
git init                      # 把当前文件夹变成一个 git 仓库
git add .                     # 把所有文件加入这次提交
git commit -m "hackathon demo" # 存一个快照，引号里是说明
```

去 github.com 点右上角 "+" → New repository，建一个**空仓库**（别勾 README），建好后复制它的地址，然后：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git  # 关联远程仓库
git branch -M main                                            # 主分支命名为 main
git push -u origin main                                       # 把代码推上去
```

首次 push 会要求登录 / 授权（可能弹浏览器或要 personal access token，跟着提示走）。

## 之后每次更新

```bash
git add .
git commit -m "改了什么"
git push
```

Vercel 连了这个仓库后，每次 push 会自动重新部署。

## 常见卡点

- **push 被拒 / 要密码但输了没用**：GitHub 现在不接受账号密码，用浏览器授权或生成 personal access token（Settings → Developer settings → Personal access tokens）当密码用。
- **`.gitignore`**：`create-next-app` 自带，确保 `node_modules` 和 `.env*` 没被提交（密钥别上传）。
- **推错了想重来**：删掉远程仓库重建，或问 AI 具体报错。
