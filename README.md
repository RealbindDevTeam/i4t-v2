# QMOV2

#variable para URL default de meteor
export ROOT_URL="http://192.168.0.100:3000/"

#variable para SMTP meteor
export MAIL_URL="smtp://XXXXXXX@gmail.com:YYYYYYYY@smtp.gmail.com:465"

#Comando para generación de cliente
meteor-client bundle --url http://192.168.0.100:3000 -c meteor-client.config.json

#Comando para instalar plugin de Facebook en el proyecto movil
ionic cordova plugin add cordova-plugin-facebook4@1.7.4 --variable APP_ID="128565331134597" --variable APP_NAME="devi4t"

#Corrección de compilado para Android
- Se debe agregar el siguiente fragmento de código en el archivo `build.gradle` que se encuentra en la ruta: 
> platforms/android/build.gradle

```
configurations.all {
    resolutionStrategy {
        force 'com.android.support:support-v4:27.1.0'
    }
}
```
- Se debe agregar la versión a las referencias de las librerias `com.google.android.gms` que se encuentra en el archivo `project.properties`
> platforms/android/project.properties

```
target=android-26
android.library.reference.1=CordovaLib
cordova.system.library.1=com.google.android.gms:play-services-maps:11.+
cordova.system.library.2=com.google.android.gms:play-services-location:11.+
```
