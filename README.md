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
    * <span class="dot">.gitignore</span>
    * README<span>.</span>md
    * 📁raspberryPi
      * 📁audio
        * <span class="procfile">pliki.mp3</span>
      * 📁modules
        * <span class="python">audio<span>.</span>py</span>
        * <span class="python">breakHandler<span>.</span>py</span>
        * <span class="python">downloader<span>.</span>py</span>
      * <span class="python">main<span>.</span>py</span>
      * requirements.txt
      * <span class="python">secrets<span>.</span>py</span>
    * 📁server
      * <span class="dot">.env</span>
      * <span class="js">app.js</span>
      * <span class="json">package-lock.json</span>
      * <span class="json">package.json</span>
      * <span class="procfile">Procfile</span>
      * 📁config
        * <span class="js">passport-setup.js</span>
        * <span class="js">winston-setup.js</span>
      * 📁logs
        * <span class="log">pliki.log</span>
      * 📁models
        * <span class="js">submition.js</span>
        * <span class="js">user.js</span>
        * <span class="js">voteElement.js</span>
      * 📁public
        * <span class="ico">favicon.ico</span>
        * 📁css
          * <span class="css">admin.css</span>
          * <span class="css">index.css</span>
          * <span class="css">main.css</span>
          * <span class="css">profile.css</span>
          * <span class="css">submit.css</span>
        * 📁images
          * <span class="log">pliki.png</span>
        * 📁js
          * <span class="js">admin.js</span>
          * <span class="js">index.js</span>
          * <span class="js">reconnection.js</span>
          * <span class="js">submit.js</span>
        * 📁routes
          * <span class="js">admin.js</span>
          * <span class="js">auth.js</span>
          * <span class="js">root.js</span>
          * <span class="js">rpi.js</span>
          * <span class="js">submit.js</span>
        * 📁views
          * <span class="ejs">admin.ejs</span>
          * <span class="ejs">error.ejs</span>
          * <span class="ejs">index.ejs</span>
          * <span class="ejs">submit.ejs</span>
            * 📁partials
              * <span class="ejs">footer.ejs</span>
              * <span class="ejs">header.ejs</span>
