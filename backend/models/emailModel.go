package models

type EmailType int

const (
	EmailTypePostLiked    EmailType = iota 
	EmailTypePostUnLiked                  
	EmailTypePostCommented                 
)

func (e EmailType) String() string {
	switch e {
	case EmailTypePostLiked:
		return "Post Beğenildi"
	case EmailTypePostUnLiked:
		return "Post Beğenisi Kaldırıldı"
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
	case EmailTypePostUnLiked:
		return "Post Beğenisi Kaldırıldı!"
	case EmailTypePostCommented:
		return "Postuna Yorum Yapıldı!"
	default:
		return "Camagru Bildirimi"
	}
}

type NotificationEmail struct {
	ToUsername   string
	FromUserID   int64
	FromUsername string
	EmailType    EmailType
	PostID       int64
}
