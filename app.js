"use strict";


/* =========================================================
 * 設定
 * ========================================================= */

const DATA_FILE = "score.json";

const LOCAL_STORAGE_KEY = "mahjong-score-data";


/* =========================================================
 * アプリ状態
 * ========================================================= */

let appData = {
  version: 1,
  updatedAt: "",
  scores: [],
  yakuman: []
};


/* =========================================================
 * DOM
 * ========================================================= */

const scoreTableBody =
  document.getElementById("scoreTableBody");

const scoreTableFooter =
  document.getElementById("scoreTableFooter");

const yakumanTableBody =
  document.getElementById("yakumanTableBody");

const yakumanTableFooter =
  document.getElementById("yakumanTableFooter");

const statusElement =
  document.getElementById("status");

const addScoreButton =
  document.getElementById("addScoreButton");

const addYakumanButton =
  document.getElementById("addYakumanButton");

const exportButton =
  document.getElementById("exportButton");

const reloadButton =
  document.getElementById("reloadButton");


/* =========================================================
 * 初期化
 * ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  await loadInitialData();

  render();

  setupEvents();

});


/* =========================================================
 * 初期データ読み込み
 * ========================================================= */

async function loadInitialData() {

  /*
   * まずGitHub Pages上のscore.jsonを読み込む。
   */

  try {

    const response = await fetch(
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

    const remoteData = await response.json();

    appData = normalizeData(remoteData);

    /*
     * GitHubのデータを読み込んだら、
     * ブラウザ側にも保存する。
     */

    saveLocalData();

    setStatus(
      `GitHubのデータを読み込みました。更新日時: ${
        formatDate(appData.updatedAt)
      }`
    );

    return;

  } catch (error) {

    console.error(
      "GitHubのscore.jsonを読み込めませんでした。",
      error
    );

  }


  /*
   * GitHubから読めなかった場合は、
   * ブラウザに保存されているデータを使用する。
   */

  const localData =
    loadLocalData();

  if (localData) {

    appData =
      normalizeData(localData);

    setStatus(
      "ブラウザに保存されているデータを使用しています。"
    );

    return;

  }


  /*
   * 何もなければ空データ。
   */

  appData =
    normalizeData({
      version: 1,
      updatedAt: "",
      scores: [],
      yakuman: []
    });

  setStatus(
    "新しいスコア表を開始しました。"
  );
}


/* =========================================================
 * データ正規化
 * ========================================================= */

function normalizeData(data) {

  if (!data || typeof data !== "object") {
    data = {};
  }

  return {
    version:
      Number(data.version) || 1,

    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : "",

    scores:
      Array.isArray(data.scores)
        ? data.scores
        : [],

    yakuman:
      Array.isArray(data.yakuman)
        ? data.yakuman
        : []
  };
}


/* =========================================================
 * イベント
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

  reloadButton.addEventListener(
    "click",
    reloadFromGitHub
  );

}


/* =========================================================
 * スコア追加
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

  saveAndRender(
    "半荘を追加しました。"
  );
}


/* =========================================================
 * 役満追加
 * ========================================================= */

function addYakuman() {

  appData.yakuman.push({
    no: appData.yakuman.length + 1,

    han: null,

    name1: null,
    name2: null,
    name3: null,
    name4: null,

    yakumanName: "",

    note: ""
  });

  saveAndRender(
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

      /*
       * 半荘数は配列順から自動採番。
       */

      score.han =
        index + 1;

      const row =
        document.createElement("tr");

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

        <td class="diff-cell" data-diff-type="score" data-index="${index}">
          0
        </td>

        <td>
          <input
            type="text"
            value="${escapeHtmlAttribute(score.note)}"
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
          >
            削除
          </button>
        </td>
      `;

      scoreTableBody.appendChild(row);
    }
  );

  updateScoreDiffs();

  renderScoreFooter();
}


/* =========================================================
 * 役満表描画
 * ========================================================= */

function renderYakumanTable() {

  yakumanTableBody.innerHTML = "";

  appData.yakuman.forEach(
    (item, index) => {

      /*
       * No.は自動採番。
       */

      item.no =
        index + 1;

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td class="index-cell">
          ${item.no}
        </td>

        <td>
          <input
            type="number"
            step="1"
            value="${inputValue(item.han)}"
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
            value="${escapeHtmlAttribute(item.yakumanName)}"
            data-type="yakuman"
            data-index="${index}"
            data-field="yakumanName"
            placeholder="役満名"
          >
        </td>

        <td>
          <input
            type="text"
            value="${escapeHtmlAttribute(item.note)}"
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
          >
            削除
          </button>
        </td>
      `;

      yakumanTableBody.appendChild(row);
    }
  );

  updateYakumanDiffs();

  renderYakumanFooter();
}


/* =========================================================
 * 数値入力HTML生成
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
 * スコア差分
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
 * スコア差分表示
 * ========================================================= */

function updateScoreDiffs() {

  document
    .querySelectorAll(
      '[data-diff-type="score"]'
    )
    .forEach(cell => {

      const index =
        Number(cell.dataset.index);

      const diff =
        calculateDiff(
          appData.scores[index]
        );

      setDiffCell(
        cell,
        diff
      );

    });
}


/* =========================================================
 * 役満差分表示
 * ========================================================= */

function updateYakumanDiffs() {

  document
    .querySelectorAll(
      '[data-diff-type="yakuman"]'
    )
    .forEach(cell => {

      const index =
        Number(cell.dataset.index);

      const diff =
        calculateDiff(
          appData.yakuman[index]
        );

      setDiffCell(
        cell,
        diff
      );

    });
}


/* =========================================================
 * 差分セル
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

  if (diff === 0) {

    cell.classList.add(
      "diff-zero"
    );

  } else if (diff > 0) {

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

      <td></td>

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
 * 縦方向の合計
 * ========================================================= */

function calculateTotals(rows) {

  return {
    name1: rows.reduce(
      (sum, row) =>
        sum + toNumber(row.name1),
      0
    ),

    name2: rows.reduce(
      (sum, row) =>
        sum + toNumber(row.name2),
      0
    ),

    name3: rows.reduce(
      (sum, row) =>
        sum + toNumber(row.name3),
      0
    ),

    name4: rows.reduce(
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

    if (!target.dataset.type) {
      return;
    }

    const type =
      target.dataset.type;

    const index =
      Number(target.dataset.index);

    const field =
      target.dataset.field;

    let value =
      target.value;

    /*
     * 数値項目
     */

    if (
      [
        "han",
        "name1",
        "name2",
        "name3",
        "name4"
      ].includes(field)
    ) {

      if (value === "") {

        value = null;

      } else {

        value =
          Number.parseInt(
            value,
            10
          );

        if (Number.isNaN(value)) {
          value = null;
        }
      }
    }

    /*
     * データ更新
     */

    if (type === "score") {

      appData.scores[index][field] =
        value;

    } else if (type === "yakuman") {

      appData.yakuman[index][field] =
        value;
    }

    /*
     * 入力のたびにブラウザへ保存
     */

    saveLocalData();

    /*
     * 差分とフッターを更新
     */

    if (type === "score") {

      updateScoreDiffs();
      renderScoreFooter();

    } else {

      updateYakumanDiffs();
      renderYakumanFooter();
    }

    setStatus(
      "編集中。入力内容はこのブラウザに保存されています。"
    );
  }
);


/* =========================================================
 * 削除イベント
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
      Number(button.dataset.index);

    const message =
      type === "score"
        ? "この半荘を削除しますか？"
        : "この役満記録を削除しますか？";

    if (!confirm(message)) {
      return;
    }

    if (type === "score") {

      appData.scores.splice(
        index,
        1
      );

      /*
       * 削除後に半荘数を振り直す。
       */

      appData.scores.forEach(
        (row, i) => {
          row.han = i + 1;
        }
      );

    } else {

      appData.yakuman.splice(
        index,
        1
      );

      /*
       * No.を振り直す。
       */

      appData.yakuman.forEach(
        (row, i) => {
          row.no = i + 1;
        }
      );
    }

    saveAndRender(
      "削除しました。"
    );
  }
);


/* =========================================================
 * 全体描画
 * ========================================================= */

function render() {

  renderScoreTable();

  renderYakumanTable();

}


/* =========================================================
 * 保存して再描画
 * ========================================================= */

function saveAndRender(
  message
) {

  saveLocalData();

  render();

  setStatus(
    `${message} GitHubへ保存する場合はJSONを書き出してください。`
  );
}


/* =========================================================
 * localStorage
 * ========================================================= */

function saveLocalData() {

  try {

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(appData)
    );

  } catch (error) {

    console.error(
      "localStorageへの保存に失敗しました。",
      error
    );
  }
}


function loadLocalData() {

  try {

    const text =
      localStorage.getItem(
        LOCAL_STORAGE_KEY
      );

    if (!text) {
      return null;
    }

    return JSON.parse(text);

  } catch (error) {

    console.error(
      "localStorageの読み込みに失敗しました。",
      error
    );

    return null;
  }
}


/* =========================================================
 * JSON書き出し
 * ========================================================= */

function exportJson() {

  /*
   * 書き出し前に最新データを整形。
   */

  const exportData =
    normalizeData(
      JSON.parse(
        JSON.stringify(appData)
      )
    );

  exportData.updatedAt =
    new Date().toISOString();

  exportData.version = 1;

  /*
   * JSON文字列化
   */

  const json =
    JSON.stringify(
      exportData,
      null,
      2
    );


  /*
   * ダウンロード
   */

  const blob =
    new Blob(
      [json],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    DATA_FILE;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);


  setStatus(
    "score.jsonを書き出しました。GitHubへCommitしてください。"
  );
}


/* =========================================================
 * GitHubから再読み込み
 * ========================================================= */

async function reloadFromGitHub() {

  if (
    !confirm(
      "GitHub上のscore.jsonを読み込みます。\n" +
      "現在ブラウザで編集中の未書き出しデータは上書きされます。\n\n" +
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
      normalizeData(data);

    saveLocalData();

    render();

    setStatus(
      `GitHubのデータを再読み込みしました。更新日時: ${
        formatDate(appData.updatedAt)
      }`
    );

  } catch (error) {

    console.error(error);

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
 * 入力値
 * ========================================================= */

function inputValue(value) {

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

function formatNumber(value) {

  return Number(value).toLocaleString(
    "ja-JP"
  );
}


/* =========================================================
 * 差分CSSクラス
 * ========================================================= */

function diffClass(value) {

  if (value === 0) {
    return "diff-zero";
  }

  if (value > 0) {
    return "diff-positive";
  }

  return "diff-negative";
}


/* =========================================================
 * 日時
 * ========================================================= */

function formatDate(value) {

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
 * HTML属性用エスケープ
 * ========================================================= */

function escapeHtmlAttribute(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
 * ステータス表示
 * ========================================================= */

function setStatus(message) {

  statusElement.textContent =
    message;
}
