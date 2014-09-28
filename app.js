var express = require('express'),					//hacemos el require a express
	app		= express(), 							//iniciamos nuestra aplicacion con express
	server	= require('http').createServer(app),	//creamos un servidor http, necesario para usar socket.io
	io		= require('socket.io').listen(server),	//socket que usaremos
	nicknames = [];									//array en el que guardaremos los nicknames de los usuarios

//hacer que el servidor escuche las peticiones en el puerto 3000
server.listen(3000);

/*	Ruteo de nuestra aplicación
	- "/" indica que llamaremos a esta función cuando se ingrese al index de nuestra aplicación
	- Luego definimos una funcion para manejar los requests y las responses http a nuestro server
	- Lo unico que hara, será llamar a un archivo llamado index.html.
*/
app.get("/", function(req, res){
	res.sendfile(__dirname + '/index.html');
});

/*
	Aca se define que hara el servidor con los eventos que vaya recibiendo
	la definimos como connection, pues simboliza cualquier conexion de un
	cliente al servidor 
*/
io.sockets.on('connection', function(socket){
	/*
		Este evento se desata cuando hay un nuevo usuario intentando entrar
		se comprueba si no existe alguien con el mismo nick y se le responde al cliente
		data es el contenido que se recibe
		callback será la respuesta al cliente
	*/
	socket.on('new user', function(data, callback){
		// Si encontramos ese nickname, devolvemos falso el cliente
		if (nicknames.indexOf(data) != -1){
			callback(false);
		}
		// Si no...
		else{
			//enviamos true al cliente
			callback(true);
			// Guardamos el nick del usuario, para luego poder mostrarlo
			socket.nickname = data;
			// Agregamos al usuario en el array de usuarios
			nicknames.push(socket.nickname);
			//llamamos a la función para enviar los usuarios que estan en linea
			updateNicknames();
		}
	});

	/*
		Esta función hace emit con los usuarios conectados, de esta forma
		el cliente los recibe 
	*/
	function updateNicknames(){
		io.sockets.emit('usernames', nicknames);
	}

	/*
		Recibimos el mensaje desde el cliente!
		OJO! el nombre del evento debe ser el mismo nombre del evento que definimos en index.html
		en este caso es 'send message'
	*/
	socket.on('send message', function(data){
		/*	hacemos un emit al mensaje recibido bajo el alias de new message
			estamos pasando dos parametros esta vez, el contenido del mensaje y el nickname del usuario
			no hay problema en hacer esto, ojo al recibir del otro lado
		*/
		io.sockets.emit('new message', {msg: data, nick: socket.nickname});
		//socket.broadcast.emit('new message', data);
	});

	/*
		Este evento se emite cuando algun usuario se desconecta del servidor
		una gran ayuda de socket.io
	*/
	socket.on('disconnect', function(data){
		//esto es cuando alguien se va sin haber elegido un nick
		if(!socket.nickname) return;
		//la función splice nos ayudará a eliminar ese nick que ya no está conectado
		nicknames.splice(nicknames.indexOf(socket.nickname),1);
		//llamamos a la función para enviar los usuarios que estan en linea
		updateNicknames();
	});
});

