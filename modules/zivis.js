let zivis, counter = [], roundZivis = [], ziviTemplate, ziviEditTemplate, ziviEditButton;

$.get("components/ziviCards.html", response => {
    ziviTemplate = response;
});
$.get("components/ziviEdit.html", response => {
    ziviEditTemplate = response;
});
$.get("components/ziviEditButton.html", response => {
    ziviEditButton = response;
});

function readZivis() {
    mysqlService.readZivisDB(function (result) {
        zivis = result;
        for (let i = 0; i < zivis.length; i++) {
            counter[zivis[i].name] = 0;
        }
        if (Vars.edit) {
            editZivi();
        } else {
            shuffleZivis();
        }
    });
}

function shuffleZivis() {
    let lastFirst = zivis[0].name;
    counter[zivis[0].name]++;
    roundZivis[roundZivis.length] = zivis[0].id;
    if (roundZivis.length === zivis.length) {
        roundZivis = [];
    }
    if (zivis.length > 1) {
        while (roundZivis.includes(zivis[0].id)) {
            //Shuffles zivi array
            let currentIndex = (zivis.length - 1),
                temporaryValue, randomIndex;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                // And swap it with the current element.
                temporaryValue = zivis[currentIndex];
                zivis[currentIndex] = zivis[randomIndex];
                zivis[randomIndex] = temporaryValue;
                currentIndex--;
            }
            if (zivis[0].name === lastFirst) {
                console.log("shuffle incorrect; shuffle again");
            }
        }
    }
    showZivis();
}

function clearZivis() {
    $("#zivis").empty();
}

function showZivis() {
    clearZivis();

    for (let i = 0; i < zivis.length; i++) {
        if (i === 0) {
            //Insert first one
            $("#zivis").prepend(ziviTemplate);
        } else {
            $("#zivi" + (i - 1)).clone().prop('id', 'zivi' + i).appendTo("#zivis");
        }
        //print content
        if (Vars.spanish) {
            $("#zivi" + i).find("#ziviname").html(zivis[i].spanish);
        } else {
            $("#zivi" + i).find("#ziviname").html(zivis[i].name);
        }
        $("#zivi" + i).find("#zivicount").html(counter[zivis[i].name]);
        $("#zivi" + i).find("#ziviimage").attr("src", zivis[i].bild);
        $("#zivi" + i).find("#zivibg").css({ backgroundColor: zivis[i].farbe });
    }
    setInterval(showRemainingPeriodOfService(), 86400000);
}

Date.prototype.addMonths = function (m) {
    let d = new Date(this);
    let years = Math.floor(m / 12);
    let months = m - (years * 12);
    if (years) d.setFullYear(d.getFullYear() + years);
    if (months) d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate()-1);
    return d;
};

// Day difference between two dates
// function diff(a, b){
//   console.log("a: ", a);
//   console.log("b: ", b);
//   const MS_PER_DAY = 1000 * 60 * 60 * 24;
//   const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
//   const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
//
//   return Math.floor((utc2 - utc1) / MS_PER_DAY);
// }

// Day difference between two dates excluding weekends
function diff(date1, date2) {
  let weeks, dateDiff, adjust = 0;

  if (date2 < date1) return -1;

  let weekday1 = date1.getDay() == 0 ? 7 : date1.getDay();
  let weekday2 = date2.getDay() == 0 ? 7 : date2.getDay();

  if ((weekday1 > 5) && (weekday2 > 5)) adjust = 1;

  weekday1 = (weekday1 > 5) ? 5 : weekday1;
  weekday2 = (weekday2 > 5) ? 5 : weekday2;
    weeks = Math.floor((date2.getTime() - date1.getTime()) / 604800000);

  weekday1 <= weekday2
    ? dateDiff = (weeks * 5) + (weekday2 - weekday1)
      : dateDiff = ((weeks + 1) * 5) - (weekday1 - weekday2);

  dateDiff -= adjust;
  return (dateDiff + 1);
}

function showRemainingPeriodOfService(){
  let today = new Date();
  for(let i=0;i<zivis.length;i++){
    let days = diff( today, zivis[i].antritt.addMonths(9) );
    let percent = Math.round((days / diff( zivis[i].antritt, zivis[i].antritt.addMonths(9) )) * 1000) / 10;
    $("#zivi" + i).find("#remainingDays").html( days + " / " + percent + "%");
  }
}

function editZivi() {
    Vars.edit = true;
    clearZivis();
    for (i = 0; i < zivis.length; i++) {
        if (i === 0) {
            //Insert first one
            $("#zivis").prepend(ziviEditTemplate);
        } else {
            $("#zivi" + (i - 1)).clone().prop('id', 'zivi' + i).appendTo("#zivis");
        }
        $("#zivis").find("#inputId").val(zivis[i].id);
        $("#zivis").find("#inputName").val(zivis[i].name);
        $("#zivis").find("#inputSpanish").val(zivis[i].spanish);
        $("#zivis").find("#inputImage").val(zivis[i].bild);
    }
    //ExitButton
    $("#zivis").prepend(ziviEditButton);
    $("#exit").click(function () {
        Vars.edit = false;
        restartSystem();
    });
    //NewButton
    $("#new").click(function () {
        mysqlService.newZiviDB();
        readZivis();
    });

    //InputChange
    $(".card .ziviedit").bind('input', function () {
        let div = $(this).parent().parent();
        div.find(".zivibutton").removeClass("btn-primary").addClass("btn-warning");
    });
    //SubmitButton
    $(".zivibutton").click(function () {
        let div = $(this).parent().parent();
        let id = div.find("#inputId").val();
        let name = div.find('#inputName').val();
        let image = div.find('#inputImage').val();
        mysqlService.updateZiviDB(name, image, id);
        div.find(".zivibutton").removeClass("btn-warning").addClass("btn-primary");
    });
    $(".zividead").click(function () {
        let div = $(this).parent().parent();
        let id = div.find("#inputId").val();
        mysqlService.killZiviDB(id);
        readZivis();
    });
}

function restartSystem() {
    Vars.war = false;
    Clock.timer(10, 0);
    Zivis.readZivis();
    Quote.reloadDailyQuote();
}

module.exports.readZivis = readZivis;
module.exports.showZivis = showZivis;
module.exports.editZivi = editZivi;
module.exports.shuffleZivis = shuffleZivis;
module.exports.showRemainingPeriodOfService = showRemainingPeriodOfService;
