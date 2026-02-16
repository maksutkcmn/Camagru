package services

import (
	"camagru/models"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"html"
	"net/smtp"
	"os"
)

func GenerateVerifyToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func SendVerifyEmail(toEmail, token string) error  {
	from := os.Getenv("SMTP_FROM")
    password := os.Getenv("SMTP_PASSWORD")
    smtpHost := os.Getenv("SMTP_HOST")
    smtpPort := os.Getenv("SMTP_PORT")
    appURL := os.Getenv("APP_URL")

    link := appURL + "/verify?token=" + token

    headers := make(map[string]string)
    headers["From"] = from
    headers["To"] = toEmail
    headers["Subject"] = "Camagru Hesap Dogrulama"
    headers["MIME-Version"] = "1.0"
    headers["Content-Type"] = "text/html; charset=\"UTF-8\""

    message := ""
    for k, v := range headers {
        message += fmt.Sprintf("%s: %s\r\n", k, v)
    }

    body := fmt.Sprintf(`
        <html>
            <body>
                <h1>Hoşgeldin!</h1>
                <p>Hesabını doğrulamak için lütfen <a href="%s">buraya tıkla</a></p>
            </body>
        </html>
    `, link)

    fullMessage := []byte(message + "\r\n" + body)

    auth := smtp.PlainAuth("", from, password, smtpHost)

    err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, fullMessage)
    return err
}

func SendNotificationEmail(toEmail string, notification models.NotificationEmail) error {
	from := os.Getenv("SMTP_FROM")
	password := os.Getenv("SMTP_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	subject := notification.EmailType.Subject()
	body := generateNotificationBody(notification)

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"UTF-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}

	fullMessage := []byte(message + "\r\n" + body)

	auth := smtp.PlainAuth("", from, password, smtpHost)

	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, fullMessage)
}

func generateNotificationBody(notification models.NotificationEmail) string {
	var content string

	toName := html.EscapeString(notification.ToUsername)
	fromName := html.EscapeString(notification.FromUsername)

	switch notification.EmailType {
	case models.EmailTypePostLiked:
		content = fmt.Sprintf(`
			<h2>Merhaba %s!</h2>
			<p><strong>%s</strong> postunu beğendi.</p>
		`, toName, fromName)

	case models.EmailTypePostUnLiked:
		content = fmt.Sprintf(`
			<h2>Merhaba %s!</h2>
			<p><strong>%s</strong> post beğenisini kaldırdı.</p>
		`, toName, fromName)

	case models.EmailTypePostCommented:
		content = fmt.Sprintf(`
			<h2>Merhaba %s!</h2>
			<p><strong>%s</strong> postuna yorum yaptı.</p>
		`, toName, fromName)

	default:
		content = "<p>Yeni bir bildiriminiz var.</p>"
	}

	return fmt.Sprintf(`
		<html>
			<body style="font-family: Arial, sans-serif; padding: 20px;">
				%s
				<hr>
				<p style="color: #666; font-size: 12px;">Bu email Camagru tarafından gönderilmiştir.</p>
			</body>
		</html>
	`, content)
}

func SendResetEmail(toEmail, token string) error {
	from := os.Getenv("SMTP_FROM")
	password := os.Getenv("SMTP_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	frontendURL := os.Getenv("FRONTEND_URL")

	link := fmt.Sprintf("%s/#/reset-password?token=%s", frontendURL, token)

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = toEmail
	headers["Subject"] = "Camagru Sifre Sifirlama"
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"UTF-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}

	body := fmt.Sprintf(`
		<html>
			<body>
				<h3>Sifreni sifirlamak icin tikla:</h3>
				<a href="%s">Sifremi Sifirla</a>
			</body>
		</html>
	`, link)

	fullMessage := []byte(message + "\r\n" + body)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, fullMessage)
}