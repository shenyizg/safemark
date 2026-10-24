# Security policy · 安全策略

SafeMark exists to keep sensitive documents private, so problems that could leak user data are
treated as security vulnerabilities — for example a request that sends file contents (or any
data derived from them) to another origin, a weakness in the Content Security Policy, or a way to
run untrusted code through a crafted image or PDF.

SafeMark 的初衷是保护敏感文件的隐私，因此任何可能泄露用户数据的问题都按安全漏洞处理，例如：把文件内容（或由其衍生的数据）发送到其他网站、内容安全策略（CSP）存在漏洞、通过特制的图片或 PDF 执行不受信任的代码等。

## Reporting a vulnerability · 报告漏洞

Please **do not open a public issue**. Report it privately through
[GitHub private vulnerability reporting](https://github.com/shenyizg/safemark/security/advisories/new)
with steps to reproduce. You can expect an initial response within a week.

请**不要公开提交 Issue**，而是通过 GitHub 的
[私密漏洞报告](https://github.com/shenyizg/safemark/security/advisories/new) 提交，并附上复现步骤。我们会在一周内回复。

## Supported versions · 支持的版本

Only the latest release (the version deployed on GitHub Pages) receives fixes.

仅最新版本（即 GitHub Pages 上部署的版本）会获得修复。
