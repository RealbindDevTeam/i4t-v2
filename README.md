# QMOV2

#variable para URL default de meteor
export ROOT_URL="http://192.168.0.100:3000/"

#variable para SMTP meteor
export MAIL_URL="smtp://XXXXXXX@gmail.com:YYYYYYYY@smtp.gmail.com:465"

#Comando para generación de cliente
meteor-client bundle --url http://192.168.0.100:3000 -c meteor-client.config.json

#Comando para instalar plugin de Facebook en el proyecto movil
ionic cordova plugin add cordova-plugin-facebook4@1.7.4 --variable APP_ID="128565331134597" --variable APP_NAME="devi4t"