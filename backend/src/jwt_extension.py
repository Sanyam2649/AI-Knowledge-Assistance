from flask_jwt_extended import JWTManager
from flask import Flask
from config import API_KEY_SECRET, JWT_EXP_DELTA_SECONDS

jwt = JWTManager()

def init_jwt(app: Flask):
    app.config["JWT_SECRET_KEY"] = API_KEY_SECRET
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = JWT_EXP_DELTA_SECONDS
    jwt.init_app(app)
