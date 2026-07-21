// @ts-check


// Add button handlers
$(() => {
    $("#score1").on("dblclick", () => onDoubleClick(1));
    $("#score2").on("dblclick", () => onDoubleClick(2));
    
    const voiceInput = $("#voiceName")
    const voices = speechSynthesis.getVoices();

    for (const voice of voices) {
        // if (!voice.lang.startsWith("en-")) continue;
        voiceInput.append(`<option value="${voice.name}">${voice.name}</option>`)
    }
    
    // Load voices
    let u = new SpeechSynthesisUtterance("");
    speechSynthesis.speak(u);

    updateScores();
})

/**
 * @param {string} text 
 * @param {number} delay 
 */
function speak(text, delay = 500) {
    let voices = speechSynthesis.getVoices();

    let voice = voices?.find(v => v.name == voiceName);
    
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    
    if (voice) {
        utterance.voice = voice;
    }
    
    speechSynthesis.cancel();
    speakCount++;
    const count = speakCount;
    setTimeout(() => {
        if (count != speakCount) return;
        speechSynthesis.speak(utterance);

        const track = new Audio("public/Silence.mp3");
        track.play();

        const interval = setInterval(() => {
            if (speechSynthesis.speaking) track.currentTime = 0;
            else clearInterval(interval);
        }, 2_000);

    }, delay);
}

// State
let serving = 0;
let goal = 25;
let voiceName = "Google US English";
let speakCount = 0;

let team1 = {
    name: "",
    score: 0,
    color: "#ff0000",
    id: 1
}

let team2 = {
    name: "",
    score: 0,
    color: "#00b7ff",
    id: 2
}


function getScoreString() {
    const team = serving == 1 ? team1 : team2;
    const otherTeam = serving == 1 ? team2 : team1;

    let teamName = "";
    let otherTeamName = "";
    if (team.name) teamName = "team " + team.name + " with";
    if (otherTeam.name) otherTeamName = "team " + otherTeam.name + " with";

    let text = `${teamName} ${team.score}, serving ${otherTeamName} ${otherTeam.score}`;
    if (otherTeam.score == team.score) {
        text = `${team.score}, all`
    }

    return text;
}

/**
 * 
 * @param {number} teamId 
 */
function onDoubleClick(teamId) {    
    serving = teamId;

    const team = teamId == 1 ? team1 : team2;
    team.score++;

    updateScores();

    let text = getScoreString();
    let delay = 0;

    // match point
    if ((team1.score >= goal - 1) || (team2.score >= goal - 1)) {
        const difference = Math.abs(team1.score - team2.score);
        if (difference >= 2 && (team1.score >= goal || team2.score >= goal)) {
            const winningTeam = team1.score > team2.score ? team1 : team2;
            const losingTeam = team1.score > team2.score ? team2 : team1;

            text = `That's the game! G G everybody! Team ${winningTeam.name || team.id} wins! Final score: ${winningTeam.score} to ${losingTeam.score}`;
            
            // play whistle
            const track = new Audio("public/Whistle.mp3");
            track.play();
            delay = 2_000;
        } else if (difference > 0) {
            text += ". GAME POINT!";

            if (difference >= 5) {
                text += "Good luck y'all, you're gonna need it. Lock in."
            }
        } else {
            text += ". Win by two."
        }
    }

    speak(text, delay);
}

function updateScores() {
    const scoreElement1 = $(`#score1 > p`);
    const scoreElement2 = $(`#score2 > p`);

    scoreElement1.text(team1.score);
    scoreElement2.text(team2.score);

    const scoreSetting1 = $("#score1input");
    const scoreSetting2 = $("#score2input");
    const serveSetting1 = $("#serving1");
    const serveSetting2 = $("#serving2");
    const colorSetting1 = $("#color1input");
    const colorSetting2 = $("#color2input");
    const goalSetting = $("#goal");
    const langSetting = $("#voiceName");

    scoreSetting1.attr("value", team1.score);
    scoreSetting2.attr("value", team2.score);

    serveSetting1.attr("checked", serving == 1 ? "" : null);
    serveSetting2.attr("checked", serving == 2 ? "" : null);

    colorSetting1.attr("value", team1.color);
    colorSetting2.attr("value", team2.color);

    goalSetting.attr("value", goal);

    for (const child of langSetting.children("option")) {
        child.selected = voiceName == child.value;
    }

    scoreElement1.parent().css("background-color", team1.color)
    scoreElement2.parent().css("background-color", team2.color)

    if (serving == 1) {
        scoreElement1.parent().addClass("serving");
        scoreElement2.parent().removeClass("serving");
    } else if (serving == 2) {
        scoreElement2.parent().addClass("serving");
        scoreElement1.parent().removeClass("serving");
    } else {
        scoreElement1.parent().removeClass("serving");
        scoreElement2.parent().removeClass("serving");
    }
}

function announceScore() {
    const text = `Current score: ${getScoreString()}`;
    speak(text);
}

function openSettings() {
    const voiceInput = $("#voiceName")
    const voices = speechSynthesis.getVoices();

    if (voiceInput.children().length == 0) {
        for (const voice of voices) {
            // if (!voice.lang.startsWith("en-")) continue;
            voiceInput.append(`<option value="${voice.name}">${voice.name}</option>`)
        }
    }


    $("#settings").show();
}

function hideSettings() {
    $("#settings").hide();
}

function saveSettings(e) {
    e.preventDefault();

    const form = new FormData(e.target);
    team1.name = form.get("team1name") ?? "";
    team1.score = parseInt(form.get("team1score") ?? '0');
    team1.color = form.get("team1color") ?? "#FF0000";

    team2.name = form.get("team2name") ?? "";
    team2.score = parseInt(form.get("team2score") ?? '0');
    team2.color = form.get("team2color") ?? "#00b7ff";

    serving = parseInt(form.get("serving") ?? '0');

    goal = parseInt(form.get("goal") ?? '25');

    voiceName = form.get("voiceName") ?? "Google US English";

    updateScores();
    hideSettings();
}

function resetGame() {
    team1.score = 0;
    team2.score = 0;

    serving = 0;
    goal = 5;

    updateScores();
}