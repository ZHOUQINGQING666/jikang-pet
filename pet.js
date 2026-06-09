/**
 * 嵇康桌宠 v3.0
 * 功能：书信往来 / 行囊物品 / 听曲BGM(自动播放)+桌面歌词
 * 桌宠形态：Q版嵇康弹琴立绘（透明PNG）
 * 放置方式：角色卡 → Extensions → Scripts → 新建脚本 → 粘贴全部内容
 * ★ 需替换：IMG_PET（桌宠立绘图床URL）、BGM_URL（音乐图床URL）
 */
(function() {
'use strict';

function boot(){
const PET_ID = 'jk-pet-root';

// 获取主文档（适配酒馆iframe环境）
let doc = document;
let win = window;
try {
    if (window.parent && window.parent !== window) {
        const parentDoc = window.parent.document;
        if (parentDoc && parentDoc.body) {
            doc = parentDoc;
            win = window.parent;
        }
    }
} catch(e) {
    doc = document;
    win = window;
}

// 等待 body 准备就绪
if (!doc.body || !doc.head) {
    setTimeout(boot, 100);
    return;
}

// 清理旧实例
[document, doc].forEach(d => { try { const el = d.getElementById(PET_ID); if(el) el.remove(); const st = d.getElementById('jk-pet-css'); if(st) st.remove(); } catch(e){} });

if (doc.getElementById(PET_ID)) return;

// ★★★ 资源URL ★★★
const IMG_PET = 'https://files.catbox.moe/c9cqkf.png';
const BGM_URL = 'https://files.catbox.moe/0v20em.mp3';

/* ===== 注入 CSS ===== */
const style = doc.createElement('style');
style.id = 'jk-pet-css';
style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;700&display=swap');

#jk-pet-root {
    --ink: #2c2b24; --ink-soft: #4c4d3f; --ink-faint: #6d6c57;
    --wax: #9e3b2a; --gold: #8a6a38; --bamboo: #5f6f4e;
    --paper: #f5efe1; --paper-deep: #e8dcc8;
    --shadow: rgba(40,30,15,.35);
    --font-body: 'Noto Serif SC','SimSun',serif;
    --font-cal: 'Ma Shan Zheng','KaiTi',serif;
    --radius: 16px;
    font-family: var(--font-body);
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important; height: 100% !important;
    z-index: 2147483647 !important;
    display: block !important;
    pointer-events: none !important;
    user-select: none;
    transform: none !important;
}
#jk-pet-root * { visibility: visible !important; }
#jk-pet-root img { display: inline-block !important; visibility: visible !important; opacity: 1 !important; max-width: 100% !important; }

/* 桌宠浮窗 - 角色立绘形态 */
.jkp-float {
    position: absolute !important; bottom: 20px !important; right: 40px !important;
    user-select: none;
    width: 150px; height: 150px;
    pointer-events: auto !important;
}
.jkp-avatar {
    width: 100%; height: 100%;
    cursor: grab; display: flex; align-items: center; justify-content: center;
    transition: transform .3s cubic-bezier(.34,1.56,.64,1);
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.35));
}
.jkp-avatar:hover { transform: scale(1.05); }
.jkp-avatar img { max-width:100%; max-height:100%; object-fit:contain; pointer-events:none; -webkit-user-drag:none; }

/* 气泡 */
.jkp-bubble {
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    background: var(--paper); border: 1px solid rgba(138,106,56,.4); border-radius: 12px;
    padding: 8px 14px; font-size: 13px; color: var(--ink-soft); white-space: nowrap;
    box-shadow: 0 4px 16px rgba(40,30,15,.25);
    opacity: 0; transition: all .4s; pointer-events: none; margin-bottom: 8px;
}
.jkp-bubble.show { opacity: 1; }
.jkp-bubble::after {
    content:''; position: absolute; bottom: -6px; left: 50%; margin-left: -6px;
    width: 12px; height: 12px; background: var(--paper);
    border-right: 1px solid rgba(138,106,56,.4); border-bottom: 1px solid rgba(138,106,56,.4);
    transform: rotate(45deg);
}

/* 菜单 */
.jkp-menu {
    position: absolute; bottom: 100%; right: 0;
    background: linear-gradient(145deg, rgba(245,239,225,.97), rgba(232,220,200,.97));
    border: 1px solid rgba(138,106,56,.35); border-radius: 16px;
    padding: 10px 0; min-width: 160px;
    box-shadow: 0 12px 40px var(--shadow); backdrop-filter: blur(12px);
    display: none; animation: jkpPop .25s cubic-bezier(.34,1.56,.64,1); margin-bottom: 10px;
}
@keyframes jkpPop { from{opacity:0;transform:scale(.9) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
.jkp-mi {
    padding: 11px 22px; font-size: 14px; color: var(--ink); cursor: pointer;
    letter-spacing: 2px; transition: all .2s; display: flex; align-items: center; gap: 9px;
}
.jkp-mi:hover { background: rgba(150,118,60,.12); color: var(--wax); }

/* 遮罩 + 面板 */
.jkp-overlay {
    position: absolute; inset: 0; background: rgba(30,25,15,.4);
    backdrop-filter: blur(4px); display: none; pointer-events: auto;
}
.jkp-overlay.open { display: block; }
.jkp-panel {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 480px; max-width: 94vw; max-height: 85vh;
    background: var(--paper); background-image: url('https://files.catbox.moe/f308mq.jpg'); background-size: cover;
    border: 1px solid rgba(138,106,56,.4); border-radius: 20px;
    box-shadow: 0 20px 60px rgba(40,30,15,.4);
    display: none; flex-direction: column; overflow: hidden;
    animation: jkpIn .3s cubic-bezier(.34,1.56,.64,1); pointer-events: auto;
}
@keyframes jkpIn { from{opacity:0;transform:translate(-50%,-50%) scale(.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
.jkp-panel.open { display: flex; }
.jkp-panel-hd {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 24px; border-bottom: 1px solid rgba(138,106,56,.3); background: rgba(245,239,225,.6);
}
.jkp-panel-title { font-family: var(--font-cal); font-size: 22px; color: var(--wax); letter-spacing: 4px; }
.jkp-panel-x {
    width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--ink-faint); font-size: 16px; transition: all .2s;
}
.jkp-panel-x:hover { background: rgba(158,59,42,.1); color: var(--wax); }
.jkp-panel-bd { flex: 1; overflow-y: auto; padding: 20px 24px; }
.jkp-panel-bd::-webkit-scrollbar { width: 4px; }
.jkp-panel-bd::-webkit-scrollbar-thumb { background: rgba(138,106,56,.25); border-radius: 4px; }

/* NPC列表 */
.jkp-npc-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.jkp-npc-btn {
    padding: 14px 8px; text-align: center; border: 1px solid rgba(138,106,56,.35); border-radius: 12px;
    cursor: pointer; font-size: 14px; color: var(--ink); background: rgba(255,252,244,.6); transition: all .2s;
}
.jkp-npc-btn:hover { background: rgba(150,118,60,.15); border-color: var(--gold); color: var(--wax); transform: translateY(-2px); }
.jkp-npc-btn small { display: block; font-size: 11px; color: var(--ink-faint); margin-top: 3px; }

/* 选择按钮 */
.jkp-choice { display: flex; flex-direction: column; gap: 14px; padding: 18px 0; }
.jkp-cbtn {
    padding: 15px 20px; border: 1px solid rgba(138,106,56,.4); border-radius: 14px;
    cursor: pointer; font-size: 15px; color: var(--ink); background: rgba(255,252,244,.5);
    transition: all .2s; text-align: center; letter-spacing: 2px;
}
.jkp-cbtn:hover { background: rgba(150,118,60,.12); border-color: var(--gold); color: var(--wax); }
.jkp-cbtn small { display: block; font-size: 12px; color: var(--ink-faint); margin-top: 3px; }

/* 信件展示 */
.jkp-letter {
    background: rgba(255,252,244,.7); border: 1px solid rgba(138,106,56,.3);
    border-radius: 14px; padding: 18px; margin-top: 12px;
}
.jkp-lmeta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: var(--ink-faint); margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed rgba(138,106,56,.3); }
.jkp-lbody { font-size: 14px; line-height: 2; color: var(--ink); white-space: pre-wrap; }
.jkp-lfooter { margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(138,106,56,.3); display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: var(--ink-faint); }

/* 回信 */
.jkp-reply { margin-top: 14px; display: flex; gap: 10px; }
.jkp-reply input {
    flex: 1; padding: 11px 14px; border: 1px solid rgba(138,106,56,.4); border-radius: 10px;
    background: rgba(255,252,244,.8); font-size: 14px; color: var(--ink); outline: none;
}
.jkp-reply input:focus { border-color: var(--gold); }
.jkp-reply button {
    padding: 11px 18px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, var(--wax), #7a2719); color: #fbeede;
    font-size: 14px; cursor: pointer; letter-spacing: 2px;
}

/* 背包 */
.jkp-money { display: flex; gap: 16px; padding: 14px; background: rgba(150,118,60,.08); border: 1px solid rgba(138,106,56,.25); border-radius: 12px; margin-bottom: 16px; justify-content: center; }
.jkp-money-i { text-align: center; font-size: 13px; color: var(--ink-soft); }
.jkp-money-i b { display: block; font-size: 20px; color: var(--gold); }
.jkp-item { padding: 12px 16px; background: rgba(255,252,244,.6); border: 1px solid rgba(138,106,56,.25); border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: all .2s; }
.jkp-item:hover { background: rgba(150,118,60,.1); }
.jkp-item b { font-size: 14px; color: var(--ink); }
.jkp-item span { font-size: 12px; color: var(--ink-faint); margin-left: 8px; }

/* BGM */
.jkp-bgm { display: flex; flex-direction: column; align-items: center; }
.jkp-disc {
    width: 110px; height: 110px; border-radius: 50%;
    background: radial-gradient(circle, #2c2b24 20%, #4a4334 22%, #3a3528 40%, #2c2b24 60%, #4a4334 80%);
    border: 3px solid var(--gold); box-shadow: 0 4px 18px rgba(40,30,15,.3);
    display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
}
.jkp-disc.spin { animation: jkpSpin 8s linear infinite; }
@keyframes jkpSpin { to{transform:rotate(360deg)} }
.jkp-disc::after { content:''; width:18px; height:18px; border-radius:50%; background:var(--gold); border:2px solid var(--paper); }
.jkp-bgm-title { font-family: var(--font-cal); font-size: 20px; color: var(--ink); letter-spacing: 3px; margin-bottom: 14px; }
.jkp-ctrls { display: flex; align-items: center; gap: 18px; margin-bottom: 16px; }
.jkp-btn {
    width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(138,106,56,.4);
    background: rgba(255,252,244,.7); display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 17px; transition: all .2s;
}
.jkp-btn:hover { background: rgba(150,118,60,.15); }
.jkp-btn.play {
    width: 52px; height: 52px; font-size: 20px;
    background: linear-gradient(135deg, var(--wax), #7a2719); border: none; color: #fbeede;
}
.jkp-btn.play:hover { transform: scale(1.05); }
.jkp-bar-wrap { width: 100%; margin-bottom: 14px; }
.jkp-bar { width: 100%; height: 4px; background: rgba(138,106,56,.15); border-radius: 2px; cursor: pointer; }
.jkp-bar-fill { height: 100%; background: linear-gradient(90deg, var(--wax), var(--gold)); border-radius: 2px; width: 0%; transition: width .3s; }
.jkp-bar-time { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); margin-top: 5px; }
.jkp-lyrics { width: 100%; height: 150px; overflow: hidden; margin-top: 10px; mask-image: linear-gradient(transparent, black 20%, black 80%, transparent); -webkit-mask-image: linear-gradient(transparent, black 20%, black 80%, transparent); }
.jkp-lyrics-in { transition: transform .5s ease; }
.jkp-lrc { text-align: center; padding: 7px 0; font-size: 13px; color: var(--ink-faint); transition: all .3s; }
.jkp-lrc.on { font-size: 15px; color: var(--wax); font-weight: 700; }

/* 桌面歌词 */
.jkp-desk-lrc {
    position: absolute !important; bottom: 180px !important; left: 50% !important; transform: translateX(-50%);
    pointer-events: none; text-align: center;
    font-family: var(--font-cal); font-size: 22px; color: var(--wax);
    text-shadow: 0 1px 4px rgba(245,239,225,.9), 0 0 12px rgba(158,59,42,.2);
    letter-spacing: 3px; opacity: 0; transition: opacity .5s;
}
.jkp-desk-lrc.show { opacity: 1 !important; }

/* 已存信件 */
.jkp-saved { padding: 10px 14px; background: rgba(255,252,244,.5); border: 1px solid rgba(138,106,56,.25); border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: all .2s; }
.jkp-saved:hover { background: rgba(150,118,60,.1); }
.jkp-saved-hd { display: flex; justify-content: space-between; font-size: 13px; }
.jkp-saved-hd b { color: var(--ink); }
.jkp-saved-pv { font-size: 12px; color: var(--ink-faint); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.jkp-del { font-size: 11px; color: #bbb; cursor: pointer; padding: 2px 5px; border-radius: 4px; }
.jkp-del:hover { color: var(--wax); background: rgba(158,59,42,.08); }

/* 通用 */
.jkp-back { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 8px; font-size: 13px; color: var(--ink-faint); cursor: pointer; margin-bottom: 12px; }
.jkp-back:hover { background: rgba(150,118,60,.1); color: var(--wax); }
.jkp-empty { text-align: center; padding: 36px; color: var(--ink-faint); font-size: 14px; font-style: italic; }
`;
doc.head.appendChild(style);

/* ===== 注入 DOM ===== */
const root = doc.createElement('div');
root.id = PET_ID;
root.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;z-index:2147483647!important;display:block!important;pointer-events:none!important;user-select:none;transform:none!important;overflow:visible!important;';
root.innerHTML = `
<div class="jkp-overlay" id="jkp-ov"></div>
<div class="jkp-float" id="jkp-float" style="position:absolute!important;bottom:20px!important;right:40px!important;width:150px!important;height:150px!important;pointer-events:auto!important;display:block!important;opacity:1!important;visibility:visible!important;">
    <div class="jkp-bubble" id="jkp-bub">叔夜候君久矣</div>
    <div class="jkp-avatar" id="jkp-av"><img src="${IMG_PET}" alt="嵇康" style="max-width:100%!important;max-height:100%!important;display:block!important;visibility:visible!important;opacity:1!important;"></div>
    <div class="jkp-menu" id="jkp-menu">
        <div class="jkp-mi" data-a="letter">✉ 书信往来</div>
        <div class="jkp-mi" data-a="bag">🎒 行囊物品</div>
        <div class="jkp-mi" data-a="bgm">🎵 听曲</div>
    </div>
</div>
<div class="jkp-desk-lrc" id="jkp-dlrc" style="position:absolute!important;bottom:180px!important;left:50%!important;transform:translateX(-50%);pointer-events:none;text-align:center;font-size:22px;letter-spacing:4px;display:block!important;visibility:visible!important;"></div>
<div class="jkp-panel" id="jkp-p-letter"><div class="jkp-panel-hd"><img class="deco-l" src="https://files.catbox.moe/xmv6s8.png" style="position:absolute;left:10px;top:7px;height:30px;opacity:.7;pointer-events:none;"><span class="jkp-panel-title">书信往来</span><img class="deco-r" src="https://files.catbox.moe/nvlzew.png" style="position:absolute;right:42px;top:5px;height:26px;opacity:.6;pointer-events:none;"><span class="jkp-panel-x" data-close="letter">✕</span></div><div class="jkp-panel-bd" id="jkp-letter-bd"></div></div>
<div class="jkp-panel" id="jkp-p-bag"><div class="jkp-panel-hd"><img src="https://files.catbox.moe/p75pn3.png" style="position:absolute;left:10px;top:7px;height:28px;opacity:.7;pointer-events:none;"><span class="jkp-panel-title">行囊</span><img src="https://files.catbox.moe/7kweml.png" style="position:absolute;right:42px;top:5px;height:28px;opacity:.6;pointer-events:none;"><span class="jkp-panel-x" data-close="bag">✕</span></div><div class="jkp-panel-bd" id="jkp-bag-bd"></div></div>
<div class="jkp-panel" id="jkp-p-bgm"><div class="jkp-panel-hd"><img src="https://files.catbox.moe/lkkzes.png" style="position:absolute;left:10px;top:7px;height:28px;opacity:.7;pointer-events:none;"><span class="jkp-panel-title">听曲</span><img src="https://files.catbox.moe/gimtpi.png" style="position:absolute;right:42px;top:5px;height:28px;opacity:.6;pointer-events:none;"><span class="jkp-panel-x" data-close="bgm">✕</span></div><div class="jkp-panel-bd" id="jkp-bgm-bd"></div></div>
`;
doc.body.appendChild(root);

/* ===== 配置 ===== */
const NPC = [
    {n:'向秀',r:'子期·挚友',c:'xiangxiu'},{n:'阮籍',r:'嗣宗·诗酒',c:'ruanji'},
    {n:'山涛',r:'巨源·大兄',c:'shantao'},{n:'刘伶',r:'伯伦·酒仙',c:'liuling'},
    {n:'阮咸',r:'仲容·乐师',c:'ruanxian'},{n:'王戎',r:'濬冲·神童',c:'wangrong'},
    {n:'钟会',r:'士季·野心',c:'zhonghui'},{n:'吕安',r:'仲悌·义友',c:'lvan'},
    {n:'司马昭',r:'子上·权臣',c:'simazhao'},{n:'长乐亭主',r:'夫人',c:'changle'},
    {n:'嵇绍',r:'延祖·吾儿',c:'jishao'},{n:'曹髦',r:'天子',c:'caomao'}
];

const LETTER_RULES = `【上帝视角规范】:\n你是全知全能的观察者，窥视角色寄出的信、草稿、残页。\n语言：半文半白，严禁现代白话。【信件本体】必须角色第一人称。\n写信对象不固定——可能写给{{user}}，也可能写给其他人物。\n严禁输出状态栏或变量。\n\n【生成格式（八标签）】:\n【写信时间】:（年月日时辰）\n【写信天气】:（2~12字）\n【写作场景】:（写信时场景）\n【信件本体】:（书信内容）\n【信件类型】:（家书/草稿/普通信件/情书等）\n【信件目前所处位置】:（书案/怀中/灰烬中等）\n【信件当前状态】:（已寄出/完好/已损毁等）\n【字迹如何】:（字迹工整/凌乱等）`;

const LRC = [
    {t:10.98,s:'[Intro]'},{t:12.72,s:'♪'},
    {t:24.62,s:'马停在山下 风停在林间'},{t:29.52,s:'抛了丝线入长河 不问谁来收'},
    {t:34.85,s:'抬头看雁远 低头抚琴弦'},{t:40.53,s:'天地这么大 够我再坐一千年'},
    {t:46.84,s:'我在山里采野果 披散着头发'},{t:51.64,s:'长啸一声穿过云 不理山下的喧哗'},
    {t:57.41,s:'不要你的官 不要你的马'},{t:62.85,s:'给我一壶酒 我拿命换一曲天涯'},
    {t:92.40,s:'炉火还没灭 铁还没打完'},{t:96.96,s:'谁在竹林外偷听 我锤子落得更慢'},
    {t:102.93,s:'你说世道险 我说世道宽'},{t:108.32,s:'只要别低头 站着死也好过跪着活一万年'},
    {t:114.39,s:'我在山里采野果 披散着头发'},{t:119.94,s:'长啸一声穿过云 不理山下的喧哗'},
    {t:125.20,s:'不要你的官 不要你的马'},{t:130.78,s:'给我一壶酒 我拿命换一曲天涯'},
    {t:142.21,s:'(humming)'},{t:148.24,s:'琴声停了 风也停了'},
    {t:153.74,s:'该说的话 我都放在弦上了'},{t:162.73,s:'这一曲弹完 就不弹了……'}
];

/* ===== 工具 ===== */
const q = id => doc.getElementById(id);

function tavernSend(text) {
    try { const ta = doc.getElementById('send_textarea'); if (ta) { ta.value = text; ta.dispatchEvent(new Event('input',{bubbles:true})); const b = doc.getElementById('send_but'); if(b){setTimeout(()=>b.click(),80); return true;} } } catch(e){}
    try { const ts = window.triggerSlash || window.parent?.triggerSlash; if(typeof ts==='function'){ts('/send '+text);return true;} } catch(e){}
    return false;
}

function getLastText() {
    try { const ms = doc.querySelectorAll('.mes_text'); if(ms.length) return ms[ms.length-1].innerText||''; } catch(e){}
    return '';
}

function parseBag(text) {
    const m = text.match(/<bag>([\s\S]*?)<\/bag>/); if(!m) return null;
    const lines = m[1].trim().split('\n').filter(l=>l.trim());
    if(!lines.length) return null;
    const bag = {money:{gold:0,silver:0,copper:0},items:[]};
    const l0 = lines[0];
    let x; x=l0.match(/金[:：](\d+)/); if(x) bag.money.gold=+x[1];
    x=l0.match(/银[:：](\d+)/); if(x) bag.money.silver=+x[1];
    x=l0.match(/铜[:：](\d+)/); if(x) bag.money.copper=+x[1];
    for(let i=1;i<lines.length;i++){const p=lines[i].split('|'); if(p.length>=2) bag.items.push({n:p[0].trim(),c:+p[1]||1,d:(p[2]||'').trim()});}
    return bag;
}

function parseMailbox(text) {
    const m = text.match(/<mailbox>([\s\S]*?)<\/mailbox>/); if(!m) return [];
    return m[1].trim().split('\n').filter(l=>l.trim()).map(l=>{const p=l.split('|');return{dir:p[0],who:p[1],time:p[2],sum:p[3]};});
}

function getLetters() { try{return JSON.parse(localStorage.getItem('jk_letters')||'[]');}catch(e){return[];} }
function setLetters(a) { try{localStorage.setItem('jk_letters',JSON.stringify(a));}catch(e){} }

/* ===== 桌宠交互 ===== */
const fl = q('jkp-float'), av = q('jkp-av'), mn = q('jkp-menu'), bub = q('jkp-bub'), ov = q('jkp-ov');
let menuOn = false, drag = null;

av.onmousedown = e => { drag = {sx:e.clientX,sy:e.clientY,ox:fl.offsetLeft,oy:fl.offsetTop,moved:false}; };
doc.addEventListener('mousemove', e => { if(!drag) return; if(Math.abs(e.clientX-drag.sx)>4||Math.abs(e.clientY-drag.sy)>4) drag.moved=true; if(drag.moved){fl.style.right='auto';fl.style.bottom='auto';fl.style.left=(drag.ox+e.clientX-drag.sx)+'px';fl.style.top=(drag.oy+e.clientY-drag.sy)+'px';} });
doc.addEventListener('mouseup', ()=>{ if(drag&&!drag.moved) toggleMenu(); drag=null; });

function toggleMenu(){ menuOn=!menuOn; mn.style.display=menuOn?'block':'none'; bub.classList.remove('show'); }
setTimeout(()=>{bub.classList.add('show');setTimeout(()=>bub.classList.remove('show'),4000);},1200);

root.querySelectorAll('.jkp-mi').forEach(i=>i.onclick=()=>{ mn.style.display='none';menuOn=false; const a=i.dataset.a; if(a==='letter')openLetter(); else if(a==='bag')openBag(); else if(a==='bgm')openBgm(); });
root.querySelectorAll('.jkp-panel-x').forEach(x=>x.onclick=closeAll);
ov.onclick = closeAll;

function closeAll(){ root.querySelectorAll('.jkp-panel').forEach(p=>p.classList.remove('open')); ov.classList.remove('open'); }
function openP(id){ closeAll(); ov.classList.add('open'); q(id).classList.add('open'); }

/* ===== 书信往来 ===== */
let curNpc = null;

function openLetter(){ openP('jkp-p-letter'); letterHome(); }

function letterHome(){
    const bd = q('jkp-letter-bd');
    const saved = getLetters();
    const mbox = parseMailbox(getLastText());
    let h = '<div class="jkp-npc-grid">';
    NPC.forEach(n=>{ h+=`<div class="jkp-npc-btn" data-c="${n.c}" data-n="${n.n}">${n.n}<small>${n.r}</small></div>`; });
    h+='</div>';
    if(mbox.length){ h+='<div style="margin-top:18px;padding-top:12px;border-top:1px solid rgba(138,106,56,.25);font-size:13px;color:var(--ink-faint);margin-bottom:8px;">📨 本回合信件</div>'; mbox.forEach(m=>{h+=`<div style="padding:7px 12px;background:rgba(255,252,244,.5);border-radius:8px;margin-bottom:5px;font-size:13px;">${m.dir==='收'?'📩':'📤'} <b>${m.who}</b>（${m.time}）${m.sum}</div>`;}); }
    if(saved.length){ h+=`<div style="margin-top:18px;padding-top:12px;border-top:1px solid rgba(138,106,56,.25);font-size:13px;color:var(--ink-faint);margin-bottom:8px;">📜 已收藏（${saved.length}）</div>`; saved.forEach((l,i)=>{h+=`<div class="jkp-saved" data-i="${i}"><div class="jkp-saved-hd"><b>${l.from||'佚名'}</b><span>${l.type||'信件'} <span class="jkp-del" data-d="${i}">✕</span></span></div><div class="jkp-saved-pv">${(l.body||'').slice(0,28)}…</div></div>`;}); }
    bd.innerHTML = h;
    bd.querySelectorAll('.jkp-npc-btn').forEach(b=>b.onclick=()=>{curNpc={c:b.dataset.c,n:b.dataset.n};letterChoice();});
    bd.querySelectorAll('.jkp-saved').forEach(c=>c.onclick=e=>{if(e.target.classList.contains('jkp-del')){const a=getLetters();a.splice(+e.target.dataset.d,1);setLetters(a);letterHome();return;}viewLetter(+c.dataset.i);});
}

function letterChoice(){
    const bd = q('jkp-letter-bd');
    bd.innerHTML=`<div class="jkp-back" id="jkp-lb">← 返回</div><div style="text-align:center;font-family:var(--font-cal);font-size:20px;color:var(--ink);margin-bottom:18px;">${curNpc.n} 的信箱</div><div class="jkp-choice"><div class="jkp-cbtn" id="jkp-cl">最新信件<small>基于当前剧情</small></div><div class="jkp-cbtn" id="jkp-co">遗落信件<small>基于角色背景往事</small></div><div class="jkp-cbtn" id="jkp-cc" style="color:var(--ink-faint);border-color:rgba(138,106,56,.2);">罢了</div></div>`;
    q('jkp-lb').onclick=letterHome; q('jkp-cl').onclick=()=>genLetter('latest'); q('jkp-co').onclick=()=>genLetter('lost'); q('jkp-cc').onclick=letterHome;
}

function genLetter(type){
    const bd = q('jkp-letter-bd');
    const pre = type==='latest'?'letter_latest_':'letter_lost_';
    const prompt = `[OOC: 以上帝视角为${curNpc.n}生成一封${type==='latest'?'基于当前剧情的最新':'过去时间节点遗落的'}信件。触发：${pre}${curNpc.c}\n\n${LETTER_RULES}\n\n现在开始。]`;
    const ok = tavernSend(prompt);
    bd.innerHTML=`<div class="jkp-back" id="jkp-lb">← 返回</div><div style="text-align:center;padding:16px;font-size:14px;color:var(--ink-soft);">${ok?'✓ 指令已发送，等待AI生成…':'独立预览模式，未连接酒馆'}</div><div style="margin-top:14px;"><textarea id="jkp-raw" style="width:100%;height:140px;padding:12px;border:1px solid rgba(138,106,56,.3);border-radius:10px;background:rgba(255,252,244,.8);font-size:13px;resize:vertical;" placeholder="粘贴AI输出的信件全文（含八个【标签】）…"></textarea><button id="jkp-sv" style="margin-top:8px;padding:10px 18px;border:none;border-radius:8px;background:var(--wax);color:#fbeede;cursor:pointer;">保存此信</button></div>`;
    q('jkp-lb').onclick=letterHome;
    q('jkp-sv').onclick=()=>{const r=q('jkp-raw').value.trim();if(!r)return;const l=parseLt(r);l.from=curNpc.n;const a=getLetters();a.unshift(l);setLetters(a);letterHome();};
}

function parseLt(raw){
    const ex=t=>{const m=raw.match(new RegExp('【'+t+'】[:：]?\\s*([\\s\\S]*?)(?=【|$)'));return m?m[1].trim():'';};
    return{time:ex('写信时间'),weather:ex('写信天气'),scene:ex('写作场景'),body:ex('信件本体'),type:ex('信件类型'),location:ex('信件目前所处位置'),status:ex('信件当前状态'),hw:ex('字迹如何')};
}

function viewLetter(i){
    const l=getLetters()[i]; if(!l)return;
    const bd=q('jkp-letter-bd');
    bd.innerHTML=`<div class="jkp-back" id="jkp-lb">← 返回</div><div style="text-align:center;font-family:var(--font-cal);font-size:20px;color:var(--ink);margin-bottom:4px;">${l.from||'佚名'} 之信</div><div style="text-align:center;font-size:12px;color:var(--ink-faint);margin-bottom:14px;">${l.type||''}</div><div class="jkp-letter"><div class="jkp-lmeta"><span>🕐 ${l.time||'不详'}</span><span>🌤 ${l.weather||'不详'}</span><span>📍 ${l.scene||'不详'}</span><span>✒ ${l.hw||'不详'}</span></div><div class="jkp-lbody">${l.body||'（空）'}</div><div class="jkp-lfooter"><span>📌 ${l.location||'不详'}</span><span>📋 ${l.status||'不详'}</span></div></div><div class="jkp-reply"><input id="jkp-ri" placeholder="提笔回信…"><button id="jkp-rs">寄出</button></div>`;
    q('jkp-lb').onclick=letterHome;
    q('jkp-rs').onclick=()=>{const t=q('jkp-ri').value.trim();if(!t)return;tavernSend(`[回信给${l.from}：${t}]`);q('jkp-ri').value='';q('jkp-ri').placeholder='已寄出~';};
}

/* ===== 背包 ===== */
function openBag(){ openP('jkp-p-bag'); renderBag(); }

function renderBag(){
    const bd=q('jkp-bag-bd');
    let bag = parseBag(getLastText());
    if(!bag) bag={money:{gold:0,silver:2,copper:350},items:[{n:'竹笛',c:1,d:'翠竹短笛，音色清越'},{n:'干粮',c:3,d:'粗麦饼，佐以盐渍野菜'},{n:'绢帕',c:1,d:'素白绢帕，角绣兰草'}]};
    let h=`<div class="jkp-money"><div class="jkp-money-i"><b>${bag.money.gold}</b>金</div><div class="jkp-money-i"><b>${bag.money.silver}</b>银</div><div class="jkp-money-i"><b>${bag.money.copper}</b>铜</div></div>`;
    if(!bag.items.length) h+='<div class="jkp-empty">行囊空空如也……</div>';
    else bag.items.forEach(it=>{h+=`<div class="jkp-item"><b>${it.n}</b>${it.c>1?' ×'+it.c:''}<span>${it.d}</span></div>`;});
    h+='<div style="margin-top:16px;font-size:11px;color:var(--ink-faint);text-align:center;">数据自动解析自AI输出的 &lt;bag&gt; 标签</div>';
    bd.innerHTML=h;
}

/* ===== BGM ===== */
let audio=null, playing=false, loop=true;
const dlrc = q('jkp-dlrc');

function initAudio(){
    audio=new Audio(BGM_URL);
    audio.loop=true;
    audio.volume=0.6;
    audio.onloadedmetadata=()=>{const el=q('jkp-dur');if(el)el.textContent=fmtT(audio.duration);};
    audio.ontimeupdate=tick;
    audio.onended=()=>{if(!loop){playing=false;const b=q('jkp-play');if(b)b.textContent='▶';const d=q('jkp-disc');if(d)d.classList.remove('spin');dlrc.classList.remove('show');}};
}

// 自动播放：打开酒馆即播放BGM
function autoPlay(){
    if(!audio)initAudio();
    audio.play().then(()=>{playing=true;}).catch(()=>{
        const handler=()=>{audio.play().then(()=>{playing=true;});doc.removeEventListener('click',handler);};
        doc.addEventListener('click',handler);
    });
}
autoPlay();

function openBgm(){ openP('jkp-p-bgm'); initBgmUI(); }

function initBgmUI(){
    const bd=q('jkp-bgm-bd');
    bd.innerHTML=`<div class="jkp-bgm"><div class="jkp-disc" id="jkp-disc"></div><div class="jkp-bgm-title">一壶酒换天涯</div><div class="jkp-ctrls"><div class="jkp-btn" id="jkp-prev">⏮</div><div class="jkp-btn play" id="jkp-play">${playing?'⏸':'▶'}</div><div class="jkp-btn" id="jkp-loop" style="opacity:${loop?'1':'.5'}">🔁</div></div><div class="jkp-bar-wrap"><div class="jkp-bar" id="jkp-bar"><div class="jkp-bar-fill" id="jkp-fill"></div></div><div class="jkp-bar-time"><span id="jkp-cur">${audio?fmtT(audio.currentTime):'0:00'}</span><span id="jkp-dur">${audio?fmtT(audio.duration):'0:00'}</span></div></div><div class="jkp-lyrics"><div class="jkp-lyrics-in" id="jkp-lin"></div></div></div>`;
    const lin=q('jkp-lin');
    LRC.forEach(l=>{const d=doc.createElement('div');d.className='jkp-lrc';d.textContent=l.s;lin.appendChild(d);});
    if(playing) q('jkp-disc').classList.add('spin');
    q('jkp-play').onclick=togglePlay;
    q('jkp-prev').onclick=()=>{if(audio){audio.currentTime=0;}};
    q('jkp-loop').onclick=()=>{loop=!loop;if(audio)audio.loop=loop;q('jkp-loop').style.opacity=loop?'1':'.5';};
    q('jkp-bar').onclick=e=>{if(!audio?.duration)return;audio.currentTime=((e.clientX-q('jkp-bar').getBoundingClientRect().left)/q('jkp-bar').offsetWidth)*audio.duration;};
}

function initAudio(){
    audio=new Audio(BGM_URL);
    audio.loop=true;
    audio.volume=0.6;
    audio.onloadedmetadata=()=>{const el=q('jkp-dur');if(el)el.textContent=fmtT(audio.duration);};
    audio.ontimeupdate=tick;
    audio.onended=()=>{if(loop){audio.currentTime=0;audio.play();}else{playing=false;const b=q('jkp-play');if(b)b.textContent='▶';const d=q('jkp-disc');if(d)d.classList.remove('spin');dlrc.classList.remove('show');}};
}

function togglePlay(){
    if(!audio)initAudio();
    if(playing){audio.pause();playing=false;const b=q('jkp-play');if(b)b.textContent='▶';const d=q('jkp-disc');if(d)d.classList.remove('spin');dlrc.classList.remove('show');}
    else{audio.play().catch(()=>{});playing=true;const b=q('jkp-play');if(b)b.textContent='⏸';const d=q('jkp-disc');if(d)d.classList.add('spin');}
}

function tick(){
    if(!audio?.duration)return;
    const pct=audio.currentTime/audio.duration*100;
    const f=q('jkp-fill');if(f)f.style.width=pct+'%';
    const c=q('jkp-cur');if(c)c.textContent=fmtT(audio.currentTime);
    let idx=0;for(let i=LRC.length-1;i>=0;i--){if(audio.currentTime>=LRC[i].t){idx=i;break;}}
    const ls=q('jkp-lin')?.querySelectorAll('.jkp-lrc');
    if(ls)ls.forEach((l,i)=>l.classList.toggle('on',i===idx));
    const lin=q('jkp-lin');if(lin)lin.style.transform=`translateY(-${Math.max(0,idx-2)*34}px)`;
    const txt=LRC[idx]?.s||'';
    if(playing&&txt&&!txt.startsWith('[')&&txt!=='♪'){dlrc.textContent=txt;dlrc.classList.add('show');}
}

function fmtT(s){if(!s||isNaN(s))return'0:00';return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');}

console.log('[嵇康桌宠] v3.1 已加载 — 立绘形态 / 自动播放 / 桌面歌词');
console.log('[嵇康桌宠] doc===document?', doc===document, '| root在DOM中?', doc.body.contains(root), '| root尺寸:', root.offsetWidth+'x'+root.offsetHeight);
console.log('[嵇康桌宠] float元素:', doc.getElementById('jkp-float'), '| img元素:', root.querySelector('img'));
}

// 确保DOM加载完毕再初始化
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}
else{setTimeout(boot,300);}
})();
