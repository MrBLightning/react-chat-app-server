const config = {
    app: {
        port: process.env.PORT || 5000
    },
    db: {
        host: "db4free.net",
        user: "type_your_user_here",
        password: "type_your_password_here",
        database: 'type_your_db_or_schema_name_here',
    },
    data: {
        adminPic: 'valid_url_to_admin_pic'
    }
};

module.exports = config;