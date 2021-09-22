# Bugs:

* ### Visual:
  * profile picture to wide in header ✔️
  * overflow scroll not working in table ✔️
  * some browsers not supporting "⮝" ✔️

* ### Functional:
  * `main.py` won't play next song after the first one ✔️

# ToDo:

* move submit and voting queues to DB ✔️
* multiple YT_KEYS ✔️
* add youtube-search-without-api-key ✔️
* zembedowane yt na admin panelu ✔️
* videos that exceed max duration showing up in /submit ✔️
* optimize current video handling ✔️
* make `breakHandler.isBreakNow()` based on `datetime` ✔️
* lyrics on admim panel ✔️

<style>
  .dot {
    color: gray;
  }
  .python {
    color: darkturquoise;
  }
  .js {
    color: goldenrod;
  }
  .css {
    color: dodgerblue;
  }
  .json {
    color:firebrick;
  }
  .procfile {
    color: mediumslateblue;
  }
  .log {
    color: limegreen;
  }
  .ico {
    color: 	tomato;
  }
  .ejs {
    color: 	olive;
  }
</style>

# Struktura:
* 📁RadioWezel
    * .gitignore
    * README<span>.</span>md
    * 📁raspberryPi
      * 📁audio
        * pliki.mp3
      * 📁modules
        * audio<span>.</span>py
        * breakHandler<span>.</span>py
        * downloader<span>.</span>py
      * main<span>.</span>py
      * requirements.txt
      * secrets<span>.</span>py
    * 📁server
      * .env
      * app.js
      * package-lock.json
      * package.json
      * Procfile
      * 📁config
        * passport-setup.js
        * winston-setup.js
      * 📁logs
        * pliki.log
      * 📁models
        * submition.js
        * user.js
        * voteElement.js
      * 📁public
        * favicon.ico
        * 📁css
          * admin.css
          * index.css
          * main.css
          * profile.css
          * submit.css
        * 📁images
          * pliki.png
        * 📁js
          * admin.js
          * index.js
          * reconnection.js
          * submit.js
        * 📁routes
          * admin.js
          * auth.js
          * root.js
          * player.js
          * submit.js
        * 📁views
          * admin.ejs
          * error.ejs
          * index.ejs
          * submit.ejs
            * 📁partials
              * footer.ejs
              * header.ejs
