<p align="center">
<img src="server/public/images/logo.png" width="30%">
</p>
<h1 align="center">RadioWęzeł63</h1>
<p align="center">
<img src="https://img.shields.io/badge/-javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=F7DF1E&labelColor=151515">
<img src="https://img.shields.io/badge/-node.js-339933?style=for-the-badge&logo=node.js&logoColor=339933&labelColor=151515">
<img src="https://img.shields.io/badge/-CSS-1572B6?style=for-the-badge&logo=css3&logoColor=1572B6&labelColor=151515">
<img src="https://img.shields.io/badge/-ejs-90a93a?style=for-the-badge&labelColor=151515&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAsAQMAAADIP61UAAAABlBMVEUTFRONqDaKAALSAAAA4UlEQVQY002RwY3DMAwEKfihp0pwKbrKwgDXmK4TlaCnHjwyu2GchLCBkb3CLklh/chVZbyxEpsRz9HWC3WcW/BAGkNN+qIU6KKT0hgRiT2Gq8QA4pP1EneRI+zCFgt4xFM6gdUpxS/X5pQ6j80ohaM6fSmVbvRVSJGFGMEYk74wYNE3FglmPH5wEuF7CdLXPhhyta64R49KY4r77hNxjLh0Z0j0G5bRJf6ITEn0zF7id/uzebzHvqVJ9WNpDop4y/E1S0ENjLr8e466r5IJFSiJ50C/unNZMRDovcJ6/1rsA2y9rRc1AunMAAAAAElFTkSuQmCC">
<img src="https://img.shields.io/badge/-mongodb-47A248?style=for-the-badge&logo=mongodb&logoColor=47A248&labelColor=151515">
</p>

<details>
  <summary> <img src="https://cdn-icons-png.flaticon.com/512/197/197374.png" width="13"> English README</summary>

# Bugs:

* Vote elements might duplicate when reviving songs from history

# ToDo:

* lyrics analyzer
* auto vote on added song
* pretty README

</details>

<details>
  <summary> <img src="https://cdn-icons-png.flaticon.com/512/197/197529.png" width="13"> Polskie README</summary>

# Strona główna:

<img width="100%" src="readme_assets/main_page.png">

Menu:\
Dla najwyższej roli w menu są dostępne następujące opcje:
* [Admin panel](#admin-panel)
* [Odtwarzacz](#odtwarzacz)
* [Użytkownicy](#użytkownicy)
* Historia
* Ustawienia
* Wyloguj

Głosy:\
Głosować mogą tylko zalogowani użytkownicy. Piosenki są odtwarzane w kolejności od mających najwyższą ilość głosów do tych z najniższą.

Dodawanie piosenek:\
Piosenki są dodawane z youtube music i zanim będą na głównej stronie muszą przejść weryfikacje administratorów.

Administratorzy mogą również usuwać piosenki które są na głównej stronie. Przytrzymując ikonkę jakiejkolwiek piosenki na każdej z ikonek pojawi się kosz:

<img width="70%" src="readme_assets/delete_song_from_main_page.png">

klikając na kosz piosenka jest usuwana z głównej strony i pojawia się na stronie z historią.

# Admin panel

<img width="100%" src="readme_assets/admin_panel.png">

Odrzucenie piosenki:\
Jeżeli piosenka jest pod jakimś względem nieodpowiednia do odtworzenia należy ją usunąć tym przyciskiem.

Zaakceptowanie piosenki:\
Jeżeli piosenka jest odpowiednia do odtworzenia należy zaakceptować ją tym przyciskiem. Wtedy pojawi się na stronie głównej i będzie można na nią głosować.

Link do piosenki:\
otwiera link z daną piosenką.

Wyświetlenie tekstu piosenki:\
Wczytuje tekst piosenki z google.

# Odtwarzacz

**Ta strona może być używana przez tylko jedną osobę naraz**

<img width="100%" src="readme_assets/player.png">

Rozpocznij kolejkę / następna piosenka:\
jeżeli od uruchomienia aplikacji nie została odtworzona żadana piosenka rozpoczyna odtwarzanie. Jeżeli aktualnie jest odtwarzana jakaś piosenka odtwarza następną. Piosenki które zostały odtworzone pojawiają się w historii.

Odtwórz / Wstrzymaj:\
Zatrzymuje lub kontynuuje odtwarzaną piosenkę.

Surowy youtube iframe:\
Wyświetla iframe który odtwarza piosenkę i logi.
(przydatne jeżeli są problemy z domyślnym odtwarzaczem)

Mały Admin panel:\
Jest to tym samym co [Admin panel](#admin-panel) tylko że na stronie z odtwarzaczem.

# Użytkownicy

<img width="100%" src="readme_assets/users_page.png">

Rola użytkownika:\
W aplikacji dostępne są 4 role:
* user: może dodawać i głosować na piosenki
* moderator: może używać admin panelu
* admin: może to co user i moderator oraz ma dostęp do: Odtwarzacza, Użytkowników, Historii i Ustawień
* developer: może wszystko

Nadanie wyższej roli / Obniżenie roli:\
Każdy mający dostęp do strony Użytkownicy może awansować i deawansować wszystkich użytkowników którzy są conajmniej o rolę niżej od ich nich.
</details>
