package models

type EmailType int

const (
	EmailTypePostLiked    EmailType = iota // Post beğenildiğinde
	EmailTypePostCommented                  // Posta yorum yapıldığında
)

func (e EmailType) String() string {
	switch e {
	case EmailTypePostLiked:
		return "Post Beğenildi"
	case EmailTypePostCommented:
		return "Yorum Yapıldı"
	default:
		return "Bilinmeyen"
	}
}

func (e EmailType) Subject() string {
	switch e {
	case EmailTypePostLiked:
		return "Postun Beğenildi!"
	case EmailTypePostCommented:
		return "Postuna Yorum Yapıldı!"
	default:
		return "Camagru Bildirimi"
	}
}

type NotificationEmail struct {
	ToUsername   string    // Kime gönderilecek
	FromUserID   int64     // Kim gönderdi (aksiyonu yapan)
	FromUsername string    // Aksiyonu yapan kullanıcı adı
	EmailType    EmailType // Email tipi
	PostID       int64     // İlgili post ID'si (opsiyonel)
}
