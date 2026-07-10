# language: es

Característica: Crear usuario
    Crear una cuenta en la plataforma del ChatBot ICPNA
    
    Escenario: Crear un usuario en el sistema de ChatBot ICPNA
        Dado que el usuario debe registrar su número para usar el ChatBot
        Cuando creo un usuario con el número "+51936214563" junto al nombre "asdf", la contraseña "asdf1234!\"#$ASDF" y el correo "asdf@asdf.com"
        Entonces el sistema retorna 201
        Y se crea la cuenta en el sistema
        Y se habilita el uso en el motor