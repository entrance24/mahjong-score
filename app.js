"use strict";


/* =========================================================
 * 設定
 * ========================================================= */

const DATA_FILE = "score.json";

const LOCAL_STORAGE_KEY =
  "mahjong-score-data-v2";


/* =========================================================
 * アプリ状態
 * ========================================================= */

let appData = {

  version: 1,

  updatedAt: "",

  players: [
    "名前1",
    "名前2",
    "名前3",
    "名前4"
  ],

  scores: [],

  yakuman: []

};


/* =========================================================
 * DOM
 * ========================================================= */

const scoreTableBody =
  document.getElementById(
    "scoreTableBody"
  );


const scoreTableFooter =
  document.getElementById(
    "scoreTableFooter"
  );


const yakumanTableBody =
  document.getElementById(
    "yakumanTableBody"
  );


const yakumanTableFooter =
  document.getElementById(
    "yakumanTableFooter"
  );


const statusElement =
  document.getElementById(
    "status"
  );


const addScoreButton =
  document.getElementById(
    "addScoreButton"
  );


const addYakumanButton =
  document.getElementById(
    "addYakumanButton"
  );


const exportButton =
  document.getElementById(
    "exportButton"
  );


const pdfButton =
  document.getElementById(
    "pdfButton"
  );


const reloadButton =
  document.getElementById(
    "reloadButton"
  );


/* =========================================================
 * 初期化
 * ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await loadInitialData();

    render();

    setupEvents();

  }
);


/* =========================================================
 * 初期データ読み込み
 *
 * localStorageに保存されたデータがある場合、
 * それを優先する。
 *
 * これにより、携帯で入力途中のデータを
 * ブラウザ再起動後にも復元できる。
 * ========================================================= */

async function loadInitialData() {

  const localData =
    loadLocalData();


  if (localData) {

    appData =
      normalizeData(
        localData
      );


    setStatus(
      "この端末に保存されていたデータを復元しました。"
    );


    return;

  }


  try {

    const response =
      await fetch(
        `${DATA_FILE}?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const remoteData =
      await response.json();


    appData =
      normalizeData(
        remoteData
      );


    saveLocalData();


    setStatus(
      "GitHubのscore.jsonを読み込みました。"
    );


  } catch (error) {

    console.error(
      "score.jsonの読み込みに失敗しました。",
      error
    );


    appData =
      normalizeData({});


    saveLocalData();


    setStatus(
      "新しいスコア表を開始しました。"
    );

  }

}


/* =========================================================
 * データ正規化
 * ========================================================= */

function normalizeData(data) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    data = {};

  }


  let players = [

    "名前1",
    "名前2",
    "名前3",
    "名前4"

  ];


  if (
    Array.isArray(
      data.players
    )
  ) {

    players =
      data.players
        .slice(0, 4)
        .map(
          (name, index) => {

            const text =
              String(
                name ?? ""
              ).trim();


            return text ||
              `名前${index + 1}`;

          }
        );


    while (
      players.length < 4
    ) {

      players.push(
        `名前${players.length + 1}`
      );

    }

  }


  return {

    version:
      Number(data.version) || 1,


    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : "",


    players,


    scores:
      Array.isArray(data.scores)
        ? data.scores.map(
            normalizeScore
          )
        : [],


    yakuman:
      Array.isArray(data.yakuman)
        ? data.yakuman.map(
            normalizeYakuman
          )
        : []

  };

}


/* =========================================================
 * スコアデータ正規化
 * ========================================================= */

function normalizeScore(
  row
) {

  return {

    han:
      Number(row?.han) || 0,

    name1:
      nullableNumber(
        row?.name1
      ),

    name2:
      nullableNumber(
        row?.name2
      ),

    name3:
      nullableNumber(
        row?.name3
      ),

    name4:
      nullableNumber(
        row?.name4
      ),

    note:
      String(
        row?.note ?? ""
      )

  };

}


/* =========================================================
 * 役満データ正規化
 * ========================================================= */

function normalizeYakuman(
  row
) {

  return {

    no:
      Number(row?.no) || 0,

    han:
      nullableNumber(
        row?.han
      ),

    name1:
      nullableNumber(
        row?.name1
      ),

    name2:
      nullableNumber(
        row?.name2
      ),

    name3:
      nullableNumber(
        row?.name3
      ),

    name4:
      nullableNumber(
        row?.name4
      ),

    yakumanName:
      String(
        row?.yakumanName ?? ""
      ),

    note:
      String(
        row?.note ?? ""
      )

  };

}


/* =========================================================
 * イベント設定
 * ========================================================= */

function setupEvents() {

  addScoreButton.addEventListener(
    "click",
    addScore
  );


  addYakumanButton.addEventListener(
    "click",
    addYakuman
  );


  exportButton.addEventListener(
    "click",
    exportJson
  );


  pdfButton.addEventListener(
    "click",
    exportPdf
  );


  reloadButton.addEventListener(
    "click",
    reloadFromGitHub
  );


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const input =
      document.getElementById(
        `playerName${i + 1}`
      );


    input.addEventListener(
      "input",
      () => {

        let value =
          input.value.trim();


        if (
          value === ""
        ) {

          value =
            `名前${i + 1}`;

        }


        appData.players[i] =
          value;


        renderPlayerNames();

        saveLocalData();


        setStatus(
          "参加者名を端末に保存しました。"
        );

      }
    );

  }

}


/* =========================================================
 * 参加者名表示
 * ========================================================= */

function renderPlayerNames() {

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const playerName =
      appData.players[i];


    const settingInput =
      document.getElementById(
        `playerName${i + 1}`
      );


    if (
      document.activeElement !==
      settingInput
    ) {

      settingInput.value =
        playerName;

    }


    document.getElementById(
      `scoreName${i + 1}`
    ).textContent =
      playerName;


    document.getElementById(
      `yakumanName${i + 1}`
    ).textContent =
      playerName;

  }

}


/* =========================================================
 * 参加者設定表示
 * ========================================================= */

function renderPlayerSettings() {

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const input =
      document.getElementById(
        `playerName${i + 1}`
      );


    input.value =
      appData.players[i];

  }

}


/* =========================================================
 * 半荘追加
 * ========================================================= */

function addScore() {

  const nextHan =
    appData.scores.length + 1;


  appData.scores.push({

    han: nextHan,

    name1: null,

    name2: null,

    name3: null,

    name4: null,

    note: ""

  });


  saveLocalData();

  render();


  setStatus(
    "半荘を追加しました。"
  );

}


/* =========================================================
 * 役満追加
 * ========================================================= */

function addYakuman() {

  appData.yakuman.push({

    no:
      appData.yakuman.length + 1,

    han: null,

    name1: null,

    name2: null,

    name3: null,

    name4: null,

    yakumanName: "",

    note: ""

  });


  saveLocalData();

  render();


  setStatus(
    "役満を追加しました。"
  );

}


/* =========================================================
 * スコア表描画
 * ========================================================= */

function renderScoreTable() {

  scoreTableBody.innerHTML = "";


  appData.scores.forEach(
    (score, index) => {

      score.han =
        index + 1;


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td class="index-cell">
          ${score.han}
        </td>


        ${createNumberInput(
          "score",
          index,
          "name1",
          score.name1
        )}


        ${createNumberInput(
          "score",
          index,
          "name2",
          score.name2
        )}


        ${createNumberInput(
          "score",
          index,
          "name3",
          score.name3
        )}


        ${createNumberInput(
          "score",
          index,
          "name4",
          score.name4
        )}


        <td
          class="diff-cell"
          data-diff-type="score"
          data-index="${index}"
        >
          0
        </td>


        <td>

          <input
            type="text"
            value="${escapeHtmlAttribute(
              score.note
            )}"
            data-type="score"
            data-index="${index}"
            data-field="note"
            placeholder="備考"
          >

        </td>


        <td class="operation-cell">

          <button
            class="button delete"
            data-delete-type="score"
            data-index="${index}"
            type="button"
          >
            削除
          </button>

        </td>

      `;


      scoreTableBody.appendChild(
        row
      );

    }
  );


  updateScoreDiffs();

  updateScoreRankings();

  renderScoreFooter();

}


/* =========================================================
 * 役満表描画
 * ========================================================= */

function renderYakumanTable() {

  yakumanTableBody.innerHTML = "";


  appData.yakuman.forEach(
    (item, index) => {

      item.no =
        index + 1;


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td class="index-cell">
          ${item.no}
        </td>


        <td>

          <input
            type="number"
            step="1"
            value="${inputValue(
              item.han
            )}"
            data-type="yakuman"
            data-index="${index}"
            data-field="han"
            placeholder="半荘数"
          >

        </td>


        ${createNumberInput(
          "yakuman",
          index,
          "name1",
          item.name1
        )}


        ${createNumberInput(
          "yakuman",
          index,
          "name2",
          item.name2
        )}


        ${createNumberInput(
          "yakuman",
          index,
          "name3",
          item.name3
        )}


        ${createNumberInput(
          "yakuman",
          index,
          "name4",
          item.name4
        )}


        <td
          class="diff-cell"
          data-diff-type="yakuman"
          data-index="${index}"
        >
          0
        </td>


        <td>

          <input
            type="text"
            value="${escapeHtmlAttribute(
              item.yakumanName
            )}"
            data-type="yakuman"
            data-index="${index}"
            data-field="yakumanName"
            placeholder="役満名"
          >

        </td>


        <td>

          <input
            type="text"
            value="${escapeHtmlAttribute(
              item.note
            )}"
            data-type="yakuman"
            data-index="${index}"
            data-field="note"
            placeholder="備考"
          >

        </td>


        <td class="operation-cell">

          <button
            class="button delete"
            data-delete-type="yakuman"
            data-index="${index}"
            type="button"
          >
            削除
          </button>

        </td>

      `;


      yakumanTableBody.appendChild(
        row
      );

    }
  );


  updateYakumanDiffs();

  updateYakumanRankings();

  renderYakumanFooter();

}


/* =========================================================
 * 数値入力HTML
 * ========================================================= */

function createNumberInput(
  type,
  index,
  field,
  value
) {

  return `

    <td>

      <input
        type="number"
        step="1"
        value="${inputValue(value)}"
        data-type="${type}"
        data-index="${index}"
        data-field="${field}"
        placeholder="0"
      >

    </td>

  `;

}


/* =========================================================
 * 差分計算
 * ========================================================= */

function calculateDiff(row) {

  return (

    toNumber(row.name1) +

    toNumber(row.name2) +

    toNumber(row.name3) +

    toNumber(row.name4)

  );

}


/* =========================================================
 * スコア差分
 * ========================================================= */

function updateScoreDiffs() {

  document
    .querySelectorAll(
      '[data-diff-type="score"]'
    )
    .forEach(
      cell => {

        const index =
          Number(
            cell.dataset.index
          );


        const diff =
          calculateDiff(
            appData.scores[index]
          );


        setDiffCell(
          cell,
          diff
        );

      }
    );

}


/* =========================================================
 * 役満差分
 * ========================================================= */

function updateYakumanDiffs() {

  document
    .querySelectorAll(
      '[data-diff-type="yakuman"]'
    )
    .forEach(
      cell => {

        const index =
          Number(
            cell.dataset.index
          );


        const diff =
          calculateDiff(
            appData.yakuman[index]
          );


        setDiffCell(
          cell,
          diff
        );

      }
    );

}


/* =========================================================
 * 差分表示
 * ========================================================= */

function setDiffCell(
  cell,
  diff
) {

  cell.textContent =
    formatNumber(diff);


  cell.classList.remove(

    "diff-zero",

    "diff-positive",

    "diff-negative"

  );


  if (
    diff === 0
  ) {

    cell.classList.add(
      "diff-zero"
    );

  } else if (
    diff > 0
  ) {

    cell.classList.add(
      "diff-positive"
    );

  } else {

    cell.classList.add(
      "diff-negative"
    );

  }

}


/* =========================================================
 * ランキング
 * ========================================================= */

function updateScoreRankings() {

  appData.scores.forEach(
    (row, index) => {

      applyRankingColors(
        "score",
        index,
        getPlayerValues(row)
      );

    }
  );

}


function updateYakumanRankings() {

  appData.yakuman.forEach(
    (row, index) => {

      applyRankingColors(
        "yakuman",
        index,
        getPlayerValues(row)
      );

    }
  );

}


/* =========================================================
 * プレイヤー4人の値
 * ========================================================= */

function getPlayerValues(row) {

  return [

    toNumber(row.name1),

    toNumber(row.name2),

    toNumber(row.name3),

    toNumber(row.name4)

  ];

}


/* =========================================================
 * トップ・最下位の彩色
 * ========================================================= */

function applyRankingColors(
  type,
  index,
  values
) {

  const inputs =
    document.querySelectorAll(
      `input[data-type="${type}"][data-index="${index}"]`
    );


  inputs.forEach(
    input => {

      input.classList.remove(
        "score-top",
        "score-bottom"
      );

    }
  );


  /*
   * 全員未入力なら彩色しない
   */

  const hasInput =
    values.some(
      value =>
        value !== 0
    );


  if (!hasInput) {

    return;

  }


  const max =
    Math.max(
      ...values
    );


  const min =
    Math.min(
      ...values
    );


  /*
   * 全員同点の場合は、
   * トップ・最下位の色を付けない。
   */

  if (
    max === min
  ) {

    return;

  }


  inputs.forEach(
    input => {

      const playerIndex =
        Number(
          input.dataset.field.replace(
            "name",
            ""
          )
        ) - 1;


      const value =
        values[playerIndex];


      if (
        value === max
      ) {

        input.classList.add(
          "score-top"
        );

      }


      if (
        value === min
      ) {

        input.classList.add(
          "score-bottom"
        );

      }

    }
  );

}


/* =========================================================
 * スコア表フッター
 * ========================================================= */

function renderScoreFooter() {

  const totals =
    calculateTotals(
      appData.scores
    );


  const diffTotal =
    appData.scores.reduce(
      (sum, row) =>
        sum + calculateDiff(row),
      0
    );


  scoreTableFooter.innerHTML = `

    <tr>

      <td class="total-label">
        合計
      </td>


      <td>
        ${formatNumber(totals.name1)}
      </td>


      <td>
        ${formatNumber(totals.name2)}
      </td>


      <td>
        ${formatNumber(totals.name3)}
      </td>


      <td>
        ${formatNumber(totals.name4)}
      </td>


      <td
        class="diff-cell ${diffClass(diffTotal)}"
      >
        ${formatNumber(diffTotal)}
      </td>


      <td></td>

      <td></td>

    </tr>

  `;

}


/* =========================================================
 * 役満表フッター
 * ========================================================= */

function renderYakumanFooter() {

  const totals =
    calculateTotals(
      appData.yakuman
    );


  const diffTotal =
    appData.yakuman.reduce(
      (sum, row) =>
        sum + calculateDiff(row),
      0
    );


  yakumanTableFooter.innerHTML = `

    <tr>

      <td class="total-label">
        合計
      </td>


      <td></td>


      <td>
        ${formatNumber(totals.name1)}
      </td>


      <td>
        ${formatNumber(totals.name2)}
      </td>


      <td>
        ${formatNumber(totals.name3)}
      </td>


      <td>
        ${formatNumber(totals.name4)}
      </td>


      <td
        class="diff-cell ${diffClass(diffTotal)}"
      >
        ${formatNumber(diffTotal)}
      </td>


      <td></td>

      <td></td>

      <td></td>

    </tr>

  `;

}


/* =========================================================
 * 合計
 * ========================================================= */

function calculateTotals(rows) {

  return {

    name1:
      rows.reduce(
        (sum, row) =>
          sum + toNumber(row.name1),
        0
      ),


    name2:
      rows.reduce(
        (sum, row) =>
          sum + toNumber(row.name2),
        0
      ),


    name3:
      rows.reduce(
        (sum, row) =>
          sum + toNumber(row.name3),
        0
      ),


    name4:
      rows.reduce(
        (sum, row) =>
          sum + toNumber(row.name4),
        0
      )

  };

}


/* =========================================================
 * 入力イベント
 * ========================================================= */

document.addEventListener(
  "input",
  event => {

    const target =
      event.target;


    if (
      !target.dataset.type
    ) {

      return;

    }


    const type =
      target.dataset.type;


    const index =
      Number(
        target.dataset.index
      );


    const field =
      target.dataset.field;


    let value =
      target.value;


    if (

      [
        "han",
        "name1",
        "name2",
        "name3",
        "name4"
      ].includes(field)

    ) {

      if (
        value === ""
      ) {

        value = null;

      } else {

        value =
          Number.parseInt(
            value,
            10
          );


        if (
          Number.isNaN(value)
        ) {

          value = null;

        }

      }

    }


    if (
      type === "score"
    ) {

      appData.scores[index][field] =
        value;

    } else if (
      type === "yakuman"
    ) {

      appData.yakuman[index][field] =
        value;

    }


    /*
     * ここが重要。
     *
     * 入力するたびにlocalStorageへ保存する。
     */

    saveLocalData();


    if (
      type === "score"
    ) {

      updateScoreDiffs();

      updateScoreRankings();

      renderScoreFooter();

    } else {

      updateYakumanDiffs();

      updateYakumanRankings();

      renderYakumanFooter();

    }


    setStatus(
      "入力内容をこの端末に保存しました。"
    );

  }
);


/* =========================================================
 * 削除
 * ========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-delete-type]"
      );


    if (!button) {

      return;

    }


    const type =
      button.dataset.deleteType;


    const index =
      Number(
        button.dataset.index
      );


    const message =
      type === "score"

        ? "この半荘を削除しますか？"

        : "この役満記録を削除しますか？";


    if (
      !confirm(message)
    ) {

      return;

    }


    if (
      type === "score"
    ) {

      appData.scores.splice(
        index,
        1
      );


      appData.scores.forEach(
        (row, i) => {

          row.han =
            i + 1;

        }
      );


    } else {

      appData.yakuman.splice(
        index,
        1
      );


      appData.yakuman.forEach(
        (row, i) => {

          row.no =
            i + 1;

        }
      );

    }


    saveLocalData();

    render();


    setStatus(
      "削除内容をこの端末に保存しました。"
    );

  }
);


/* =========================================================
 * 全体描画
 * ========================================================= */

function render() {

  renderPlayerNames();

  renderPlayerSettings();

  renderScoreTable();

  renderYakumanTable();

}


/* =========================================================
 * localStorage保存
 * ========================================================= */

function saveLocalData() {

  try {

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(
        appData
      )
    );

  } catch (error) {

    console.error(
      "localStorageへの保存に失敗しました。",
      error
    );


    setStatus(
      "端末への保存に失敗しました。"
    );

  }

}


/* =========================================================
 * localStorage読み込み
 * ========================================================= */

function loadLocalData() {

  try {

    const text =
      localStorage.getItem(
        LOCAL_STORAGE_KEY
      );


    if (!text) {

      return null;

    }


    return JSON.parse(
      text
    );

  } catch (error) {

    console.error(
      "localStorageの読み込みに失敗しました。",
      error
    );


    return null;

  }

}


/* =========================================================
 * JSON出力
 * ========================================================= */

function exportJson() {

  const exportData =
    normalizeData(
      JSON.parse(
        JSON.stringify(
          appData
        )
      )
    );


  exportData.updatedAt =
    new Date().toISOString();


  exportData.version =
    1;


  const json =
    JSON.stringify(
      exportData,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type: "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    DATA_FILE;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );


  /*
   * JSON出力したデータも、
   * 最新状態として端末に保存する。
   */

  appData.updatedAt =
    exportData.updatedAt;


  saveLocalData();


  setStatus(
    "score.jsonを出力しました。GitHubへCommitしてください。"
  );

}


/* =========================================================
 * PDF出力
 *
 * ブラウザ標準の印刷機能を利用。
 *
 * 「PDF出力」→ 印刷画面 →
 * 「PDFとして保存」
 * ========================================================= */

function exportPdf() {

  buildPrintArea();


  setStatus(
    "PDF用の印刷画面を準備しています..."
  );


  /*
   * DOMの描画を待ってから印刷する。
   */

  setTimeout(
    () => {

      window.print();

      setStatus(
        "印刷画面を表示しました。PDFとして保存できます。"
      );

    },
    100
  );

}


/* =========================================================
 * PDF用レイアウト生成
 * ========================================================= */

function buildPrintArea() {

  const printDate =
    document.getElementById(
      "printDate"
    );


  const printPlayers =
    document.getElementById(
      "printPlayers"
    );


  const printScoreTable =
    document.getElementById(
      "printScoreTable"
    );


  const printYakumanTable =
    document.getElementById(
      "printYakumanTable"
    );


  printDate.textContent =
    new Date().toLocaleString(
      "ja-JP"
    );


  /*
   * 参加者
   */

  printPlayers.innerHTML =
    appData.players
      .map(
        name => `
          <div class="print-player">
            ${escapeHtml(name)}
          </div>
        `
      )
      .join("");


  /*
   * スコア表
   */

  printScoreTable.innerHTML =
    buildPrintScoreTable();


  /*
   * 役満表
   */

  printYakumanTable.innerHTML =
    buildPrintYakumanTable();

}


/* =========================================================
 * PDF用スコア表
 * ========================================================= */

function buildPrintScoreTable() {

  const totals =
    calculateTotals(
      appData.scores
    );


  const diffTotal =
    appData.scores.reduce(
      (sum, row) =>
        sum + calculateDiff(row),
      0
    );


  let html = `

    <thead>

      <tr>

        <th>半荘</th>

        <th>${escapeHtml(appData.players[0])}</th>

        <th>${escapeHtml(appData.players[1])}</th>

        <th>${escapeHtml(appData.players[2])}</th>

        <th>${escapeHtml(appData.players[3])}</th>

        <th>差分</th>

        <th>備考</th>

      </tr>

    </thead>


    <tbody>
  `;


  appData.scores.forEach(
    row => {

      const values =
        getPlayerValues(row);


      const ranking =
        getRankingClasses(values);


      const diff =
        calculateDiff(row);


      html += `

        <tr>

          <td>
            ${row.han}
          </td>


          <td class="${ranking[0]}">
            ${formatNumber(values[0])}
          </td>


          <td class="${ranking[1]}">
            ${formatNumber(values[1])}
          </td>


          <td class="${ranking[2]}">
            ${formatNumber(values[2])}
          </td>


          <td class="${ranking[3]}">
            ${formatNumber(values[3])}
          </td>


          <td class="${printDiffClass(diff)}">
            ${formatNumber(diff)}
          </td>


          <td>
            ${escapeHtml(row.note)}
          </td>

        </tr>

      `;

    }
  );


  html += `

    </tbody>


    <tfoot>

      <tr>

        <td>
          合計
        </td>


        <td>
          ${formatNumber(totals.name1)}
        </td>


        <td>
          ${formatNumber(totals.name2)}
        </td>


        <td>
          ${formatNumber(totals.name3)}
        </td>


        <td>
          ${formatNumber(totals.name4)}
        </td>


        <td class="${printDiffClass(diffTotal)}">
          ${formatNumber(diffTotal)}
        </td>


        <td></td>

      </tr>

    </tfoot>

  `;


  return html;

}


/* =========================================================
 * PDF用役満表
 * ========================================================= */

function buildPrintYakumanTable() {

  const totals =
    calculateTotals(
      appData.yakuman
    );


  const diffTotal =
    appData.yakuman.reduce(
      (sum, row) =>
        sum + calculateDiff(row),
      0
    );


  let html = `

    <thead>

      <tr>

        <th>No.</th>

        <th>半荘</th>

        <th>${escapeHtml(appData.players[0])}</th>

        <th>${escapeHtml(appData.players[1])}</th>

        <th>${escapeHtml(appData.players[2])}</th>

        <th>${escapeHtml(appData.players[3])}</th>

        <th>差分</th>

        <th>役満名</th>

        <th>備考</th>

      </tr>

    </thead>


    <tbody>
  `;


  appData.yakuman.forEach(
    row => {

      const values =
        getPlayerValues(row);


      const ranking =
        getRankingClasses(values);


      const diff =
        calculateDiff(row);


      html += `

        <tr>

          <td>
            ${row.no}
          </td>


          <td>
            ${inputValue(row.han)}
          </td>


          <td class="${ranking[0]}">
            ${formatNumber(values[0])}
          </td>


          <td class="${ranking[1]}">
            ${formatNumber(values[1])}
          </td>


          <td class="${ranking[2]}">
            ${formatNumber(values[2])}
          </td>


          <td class="${ranking[3]}">
            ${formatNumber(values[3])}
          </td>


          <td class="${printDiffClass(diff)}">
            ${formatNumber(diff)}
          </td>


          <td>
            ${escapeHtml(row.yakumanName)}
          </td>


          <td>
            ${escapeHtml(row.note)}
          </td>

        </tr>

      `;

    }
  );


  html += `

    </tbody>


    <tfoot>

      <tr>

        <td>
          合計
        </td>


        <td></td>


        <td>
          ${formatNumber(totals.name1)}
        </td>


        <td>
          ${formatNumber(totals.name2)}
        </td>


        <td>
          ${formatNumber(totals.name3)}
        </td>


        <td>
          ${formatNumber(totals.name4)}
        </td>


        <td class="${printDiffClass(diffTotal)}">
          ${formatNumber(diffTotal)}
        </td>


        <td></td>


        <td></td>

      </tr>

    </tfoot>

  `;


  return html;

}


/* =========================================================
 * PDF用ランキングクラス
 * ========================================================= */

function getRankingClasses(
  values
) {

  const result = [
    "",
    "",
    "",
    ""
  ];


  const hasInput =
    values.some(
      value =>
        value !== 0
    );


  if (!hasInput) {

    return result;

  }


  const max =
    Math.max(
      ...values
    );


  const min =
    Math.min(
      ...values
    );


  /*
   * 全員同点なら色を付けない。
   */

  if (
    max === min
  ) {

    return result;

  }


  values.forEach(
    (value, index) => {

      if (
        value === max
      ) {

        result[index] =
          "print-top";

      }


      if (
        value === min
      ) {

        result[index] =
          "print-bottom";

      }

    }
  );


  return result;

}


/* =========================================================
 * PDF用差分クラス
 * ========================================================= */

function printDiffClass(
  value
) {

  if (
    value === 0
  ) {

    return "print-zero";

  }


  if (
    value > 0
  ) {

    return "print-positive";

  }


  return "print-negative";

}


/* =========================================================
 * GitHubから再読み込み
 * ========================================================= */

async function reloadFromGitHub() {

  if (

    !confirm(
      "GitHub上のscore.jsonを読み込みます。\n\n" +
      "この端末で現在編集中のデータは破棄されます。\n\n" +
      "続行しますか？"
    )

  ) {

    return;

  }


  setStatus(
    "GitHubからデータを読み込んでいます..."
  );


  try {

    const response =
      await fetch(
        `${DATA_FILE}?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    appData =
      normalizeData(
        data
      );


    /*
     * GitHub版をlocalStorageへ保存し直す。
     */

    saveLocalData();


    render();


    setStatus(
      `GitHubのデータを読み込みました。更新日時: ${
        formatDate(
          appData.updatedAt
        )
      }`
    );


  } catch (error) {

    console.error(
      error
    );


    setStatus(
      "GitHubからの読み込みに失敗しました。"
    );


    alert(
      "score.jsonを読み込めませんでした。"
    );

  }

}


/* =========================================================
 * 数値変換
 * ========================================================= */

function toNumber(value) {

  if (

    value === null ||
    value === undefined ||
    value === ""

  ) {

    return 0;

  }


  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
 * null許容数値
 * ========================================================= */

function nullableNumber(
  value
) {

  if (

    value === null ||
    value === undefined ||
    value === ""

  ) {

    return null;

  }


  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : null;

}


/* =========================================================
 * 入力値
 * ========================================================= */

function inputValue(
  value
) {

  if (

    value === null ||
    value === undefined

  ) {

    return "";

  }


  return escapeHtmlAttribute(
    String(value)
  );

}


/* =========================================================
 * 数値表示
 * ========================================================= */

function formatNumber(
  value
) {

  return Number(
    value
  ).toLocaleString(
    "ja-JP"
  );

}


/* =========================================================
 * 差分CSS
 * ========================================================= */

function diffClass(
  value
) {

  if (
    value === 0
  ) {

    return "diff-zero";

  }


  if (
    value > 0
  ) {

    return "diff-positive";

  }


  return "diff-negative";

}


/* =========================================================
 * 日時
 * ========================================================= */

function formatDate(
  value
) {

  if (!value) {

    return "未設定";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleString(
    "ja-JP"
  );

}


/* =========================================================
 * HTMLエスケープ
 * ========================================================= */

function escapeHtml(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
 * HTML属性エスケープ
 * ========================================================= */

function escapeHtmlAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
 * ステータス
 * ========================================================= */

function setStatus(
  message
) {

  statusElement.textContent =
    message;

}
