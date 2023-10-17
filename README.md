Это небольшой бот, у которого есть возможность расширить его функции путём добавления новых модулей.
В дальнейшем я планирую иногда обновлять базу модулей и сохранить обратную совместимость.

Также если вас не интересует MongoDB вы можете спокойно отключить её, благо подключается она только в index.mjs и заменить на работу с .json файлами.

Сейчас вы можете просто запустить бота, и написать свои модули, которые будут работать так, как вам удобно.
Для создания нового модуля у вас есть небольшой скрипт, который генерирует типизацию, сделано это для того, чтобы постоянно не переключатся между вкладками, возможно это не лучшее решение, тем не менее что-то лучше я придумать не смог.
Для создания нового модуля вам необходимо написать такую команду:

Создать шаблон модуля без переменных: npm run create <название модуля>
Создание шаблона модуля с переменными: npm run create <название модуля> v <название переменной>:<тип переменной>

После v можно написать сколько угодно переменных.
Типы переменных:
s: Строка
n: Число
b: Булево значение (true/false)

Также доступны массивы в качестве переменных:
s. : Массив строк (Для примера банворды, за которые бот будет мутить)
n. : Массив чисел (Примера не придумал wires)

Переменными они названы не просто так, в дальнейшем планируется, что эти параметры можно будет изменять из панели управления, которая сейчас находится в разработке, когда я её релизну здесь будет ссылка на репозиторий.
Также в дальнейшем большая часть будет производится через MongoDB, но возможно я добавлю классы, которые будут предоставлять api, через которое бот будет получать данные, а там уже можно будет делать так, как вам удобно, через любую бд, или файловую систему.