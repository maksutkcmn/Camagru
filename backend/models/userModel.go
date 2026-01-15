package models

type User struct {
	ID       		int64  `json:"id"`
	Username 		string `json:"username" binding:"required"`
	Email    		string `json:"email" binding:"required"`
	Password    	string `json:"password" binding:"required"`
}

type UserDTO struct {
	Username	 		string 	`json:"username"`
	Email	    		string 	`json:"email"`
	Notifications    	bool 	`json:"notifications"`
	IsVerified	    	bool 	`json:"is_verified"`
	CreatedAt			string	`json:"created_at"`
}

type LoginDTO struct {
	Username	string	`json:"username" binding:"required"`
	Password	string	`json:"password" binding:"required"`
}