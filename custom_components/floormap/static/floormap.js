// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o5) {
    if (this._$cssResult$ = true, o5 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s4 && 1 === s4.length;
      e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e4) => {
  const o5 = 1 === t3.length ? t3[0] : e4.reduce((e5, s4, o6) => e5 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t3[o6 + 1], t3[0]);
  return new n(o5, t3, s);
};
var S = (s4, o5) => {
  if (e) s4.adoptedStyleSheets = o5.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e4 of o5) {
    const o6 = document.createElement("style"), n4 = t.litNonce;
    void 0 !== n4 && o6.setAttribute("nonce", n4), o6.textContent = e4.cssText, s4.appendChild(o6);
  }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s4 of t4.cssRules) e4 += s4.cssText;
  return r(e4);
})(t3) : t3;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s4) => t3;
var u = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i5 = t3;
  switch (s4) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s4) => !i2(t3, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
      void 0 !== h3 && e2(this.prototype, t3, h3);
    }
  }
  static getPropertyDescriptor(t3, s4, i5) {
    const { get: e4, set: r4 } = h(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e4, set(s5) {
      const h3 = e4?.call(this);
      r4?.call(this, s5), this.requestUpdate(t3, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
      for (const i5 of s4) this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4) for (const [t4, i5] of s4) this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i5 = this._$Eu(t4, s4);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e4 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e4) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t3, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i5) {
    this._$AK(t3, i5);
  }
  _$ET(t3, s4) {
    const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e4 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i5 = this.constructor, e4 = i5._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i5.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e4;
      const r4 = h3.fromAttribute(s4, t4.type);
      this[e4] = r4 ?? this._$Ej?.get(e4) ?? r4, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i5, e4 = false, h3) {
    if (void 0 !== t3) {
      const r4 = this.constructor;
      if (false === e4 && (h3 = this[t3]), i5 ??= r4.getPropertyOptions(t3), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r4._$Eu(t3, i5)))) return;
      this.C(t3, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i5, reflect: e4, wrapped: h3 }, r4) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r4 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r4) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t5, s5] of this._$Ep) this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s5, i5] of t4) {
        const { wrapped: t5 } = i5, e4 = this[s5];
        true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i5, e4);
      }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t3) => t3;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t3, i5) => {
  const s4 = t3.length - 1, e4 = [];
  let n4, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t3[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n4 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n4 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n4 = void 0);
    const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i5 }, e4) {
    let r4;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
    if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r4 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r4.nodeType) {
        if (r4.hasAttributes()) for (const t4 of r4.getAttributeNames()) if (t4.endsWith(h2)) {
          const i6 = v2[a3++], s4 = r4.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i6);
          d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r4.removeAttribute(t4);
        } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r4.removeAttribute(t4));
        if (y2.test(r4.tagName)) {
          const t4 = r4.textContent.split(o3), i6 = t4.length - 1;
          if (i6 > 0) {
            r4.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++) r4.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r4.append(t4[i6], c3());
          }
        }
      } else if (8 === r4.nodeType) if (r4.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = r4.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t3, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i5, s4 = t3, e4) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o5 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o5 && (h3?._$AO?.(false), void 0 === o5 ? h3 = void 0 : (h3 = new o5(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var R = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e4;
    let h3 = P.nextNode(), o5 = 0, n4 = 0, r4 = s4[0];
    for (; void 0 !== r4; ) {
      if (o5 === r4.index) {
        let i6;
        2 === r4.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r4 = s4[++n4];
      }
      o5 !== r4?.index && (h3 = P.nextNode(), o5++);
    }
    return P.currentNode = l2, e4;
  }
  p(t3) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i5, s4, e4) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e4) this._$AH.p(i5);
    else {
      const t4 = new R(e4, this), s5 = t4.u(this.options);
      t4.p(i5), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = C.get(t3.strings);
    return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e4 = 0;
    for (const h3 of t3) e4 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e4], s4._$AI(h3), e4++;
    e4 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i5.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i3(t3).nextSibling;
      i3(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s4, e4, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i5 = this, s4, e4) {
    const h3 = this.strings;
    let o5 = false;
    if (void 0 === h3) t3 = M(this, t3, i5, 0), o5 = !a2(t3) || t3 !== this._$AH && t3 !== E, o5 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n4, r4;
      for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = M(this, e5[s4 + n4], i5, n4), r4 === E && (r4 = this._$AH[n4]), o5 ||= !a2(r4) || r4 !== this._$AH[n4], r4 === A ? t3 = A : t3 !== A && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
    }
    o5 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i5, s4, e4, h3) {
    super(t3, i5, s4, e4, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = M(this, t3, i5, 0) ?? A) === E) return;
    const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
    e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i5, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2");
var D = (t3, i5, s4) => {
  const e4 = s4?.renderBefore ?? i5;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e4._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const r4 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r4, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// src/lib/entity-actions.ts
function resolveEntityAction(serviceIds, entityId, currentState) {
  const domain = entityId.split(".")[0];
  const actions = new Set(serviceIds);
  if (actions.has("homeassistant.toggle")) {
    return { domain: "homeassistant", service: "toggle" };
  }
  if (actions.has(`${domain}.toggle`)) {
    return { domain, service: "toggle" };
  }
  const isOn = currentState === "on";
  if (actions.has("homeassistant.turn_on") && actions.has("homeassistant.turn_off")) {
    return { domain: "homeassistant", service: isOn ? "turn_off" : "turn_on" };
  }
  if (actions.has(`${domain}.turn_on`) && actions.has(`${domain}.turn_off`)) {
    return { domain, service: isOn ? "turn_off" : "turn_on" };
  }
  return null;
}

// src/lib/entity-display.ts
var DOOR_DEVICE_CLASSES = /* @__PURE__ */ new Set(["door", "opening"]);
var GARAGE_DEVICE_CLASSES = /* @__PURE__ */ new Set(["garage", "garage_door"]);
var OPEN_STATES = /* @__PURE__ */ new Set(["on", "open", "opening"]);
var CLOSED_STATES = /* @__PURE__ */ new Set(["off", "closed", "closing"]);
function asString(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function normalizedState(stateObj) {
  return asString(stateObj?.state)?.toLowerCase();
}
function entityDomain(entityId) {
  const [domain] = entityId.split(".");
  return domain ?? "";
}
function entityDeviceClass(stateObj) {
  return asString(stateObj?.attributes.device_class)?.toLowerCase();
}
function tokenPattern(token) {
  return new RegExp(`(^|[\\s._-])${token}([\\s._-]|$)`, "i");
}
function matchesToken(value, token) {
  return value ? tokenPattern(token).test(value) : false;
}
function entityBaseIcon(stateObj, fallback) {
  return asString(stateObj?.attributes.icon) ?? fallback?.icon ?? "mdi:map-marker";
}
function entityDoorKind(entityId, stateObj, fallback) {
  const deviceClass = entityDeviceClass(stateObj);
  if (deviceClass && GARAGE_DEVICE_CLASSES.has(deviceClass)) {
    return "garage";
  }
  if (deviceClass && DOOR_DEVICE_CLASSES.has(deviceClass)) {
    return "door";
  }
  const icon = entityBaseIcon(stateObj, fallback).toLowerCase();
  if (matchesToken(icon, "garage")) {
    return "garage";
  }
  if (matchesToken(icon, "door")) {
    return "door";
  }
  const label = entityLabel(stateObj, fallback, entityId).toLowerCase();
  if (matchesToken(label, "garage")) {
    return "garage";
  }
  if (matchesToken(label, "door")) {
    return "door";
  }
  const domain = entityDomain(entityId);
  if (domain === "binary_sensor" || domain === "cover") {
    if (matchesToken(entityId.toLowerCase(), "garage")) {
      return "garage";
    }
    if (matchesToken(entityId.toLowerCase(), "door")) {
      return "door";
    }
  }
  return null;
}
function doorStateIcon(kind, stateObj) {
  const state = normalizedState(stateObj);
  if (!state) {
    return null;
  }
  if (OPEN_STATES.has(state)) {
    return kind === "garage" ? "mdi:garage-open" : "mdi:door-open";
  }
  if (CLOSED_STATES.has(state)) {
    return kind === "garage" ? "mdi:garage" : "mdi:door-closed";
  }
  return null;
}
function entityLabel(stateObj, fallback, entityId) {
  return asString(stateObj?.attributes.friendly_name) ?? fallback?.name ?? entityId;
}
function entityIcon(entityId, stateObj, fallback) {
  const doorKind = entityDoorKind(entityId, stateObj, fallback);
  if (doorKind) {
    const statefulIcon = doorStateIcon(doorKind, stateObj);
    if (statefulIcon) {
      return statefulIcon;
    }
  }
  return entityBaseIcon(stateObj, fallback);
}
function entityUsesLampPalette(entityId, stateObj, fallback) {
  const domain = entityDomain(entityId);
  if (domain === "light") {
    return true;
  }
  const name = entityLabel(stateObj, fallback, entityId).toLowerCase();
  if (name.includes("lamp")) {
    return true;
  }
  const icon = entityBaseIcon(stateObj, fallback).toLowerCase();
  return icon.includes("lamp") || icon.includes("lightbulb");
}

// src/lib/floormap-math.ts
var MIN_SCALE = 1;
var MAX_SCALE = 4;
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function clampCoordinate(value) {
  return clamp(value, 0, 1);
}
function zoomAroundPoint(transform, anchorX, anchorY, nextScale) {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const ratio = scale / transform.scale;
  return {
    scale,
    panX: anchorX - (anchorX - transform.panX) * ratio,
    panY: anchorY - (anchorY - transform.panY) * ratio
  };
}

// src/index.ts
var DOMAIN = "floormap";
var FLOORPLAN_API_PATH = `/api/${DOMAIN}/floorplan`;
var EVENT_LAYOUT_UPDATED = "floormap_layout_updated";
var GET_LAYOUT_COMMAND = `${DOMAIN}/get_layout`;
var SAVE_LAYOUT_COMMAND = `${DOMAIN}/save_layout`;
var UPLOAD_FLOORPLAN_COMMAND = `${DOMAIN}/upload_floorplan`;
var MARKER_LONG_PRESS_MS = 450;
var MARKER_LONG_PRESS_MOVE_THRESHOLD = 10;
var FAN_DOUBLE_CLICK_DELAY_MS = 240;
var FAN_SLIDER_HIDE_DELAY_MS = 1e3;
var baseStyles = i`
  :host {
    display: block;
    color: var(--primary-text-color);
    --floormap-surface: var(--ha-card-background, var(--card-background-color, #111827));
    --floormap-outline: color-mix(in srgb, var(--divider-color, #334155) 70%, transparent);
    --floormap-accent: var(--primary-color, #2563eb);
    --floormap-accent-soft: color-mix(in srgb, var(--floormap-accent) 16%, transparent);
    --floormap-muted: var(--secondary-text-color, #94a3b8);
  }

  * {
    box-sizing: border-box;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    border: 1px solid var(--floormap-outline);
    background: color-mix(in srgb, var(--floormap-surface) 88%, white 12%);
    color: inherit;
    border-radius: 8px;
    padding: 0.55rem 0.8rem;
    cursor: pointer;
  }

  button:hover {
    border-color: color-mix(in srgb, var(--floormap-accent) 40%, var(--floormap-outline));
  }

  button.primary {
    background: var(--floormap-accent);
    border-color: var(--floormap-accent);
    color: white;
  }

  button:disabled {
    opacity: 0.55;
    cursor: default;
  }

  input[type="search"],
  input[type="text"] {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--floormap-outline);
    background: color-mix(in srgb, var(--floormap-surface) 86%, white 14%);
    color: inherit;
  }

  .muted {
    color: var(--floormap-muted);
  }

  .empty-state {
    display: grid;
    place-items: center;
    min-height: 280px;
    padding: 1.5rem;
    text-align: center;
    color: var(--floormap-muted);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .toolbar-spacer {
    flex: 1 1 auto;
  }

  .map-shell {
    display: grid;
    gap: 0.75rem;
  }

  .map-frame {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--floormap-outline);
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      color-mix(in srgb, var(--floormap-surface) 80%, black 20%);
    background-size: 24px 24px, 24px 24px, auto;
    touch-action: none;
    user-select: none;
  }

  .map-surface {
    position: relative;
    width: 100%;
    aspect-ratio: var(--floormap-aspect-ratio, 16 / 9);
    overflow: hidden;
    cursor: grab;
  }

  .map-surface.panning {
    cursor: grabbing;
  }

  .map-transform {
    position: absolute;
    inset: 0;
    transform-origin: 0 0;
  }

  .map-stage {
    position: absolute;
  }

  .map-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
  }

  .markers {
    position: absolute;
    inset: 0;
  }

  .marker {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .marker-button,
  .marker-chip {
    display: inline-grid;
    place-items: center;
    width: calc(2.8rem * var(--marker-scale, 1));
    height: calc(2.8rem * var(--marker-scale, 1));
    min-width: calc(2.8rem * var(--marker-scale, 1));
    min-height: calc(2.8rem * var(--marker-scale, 1));
    aspect-ratio: 1 / 1;
    appearance: none;
    border: 2px solid var(--floormap-outline);
    border-radius: 50%;
    padding: 0;
    overflow: hidden;
    clip-path: circle(50% at 50% 50%);
    background: color-mix(in srgb, var(--floormap-surface) 82%, black 18%);
    color: inherit;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(10px);
    line-height: 1;
    flex: 0 0 auto;
  }

  .marker-button {
    cursor: pointer;
  }

  .marker.is-active .marker-button,
  .marker.is-active .marker-chip {
    border-color: color-mix(in srgb, #22c55e 75%, var(--floormap-outline));
    background: color-mix(in srgb, #22c55e 28%, var(--floormap-surface));
  }

  .marker.is-light .marker-button,
  .marker.is-light .marker-chip {
    border-color: rgba(203, 213, 225, 0.9);
    background: rgba(255, 255, 255, 0.96);
    color: #334155;
  }

  .marker.is-light.is-active .marker-button,
  .marker.is-light.is-active .marker-chip {
    border-color: rgba(245, 184, 73, 0.98);
    background: rgba(255, 233, 173, 0.98);
    color: #6b4f00;
    box-shadow: 0 0 0 2px rgba(255, 214, 102, 0.18), 0 8px 22px rgba(255, 196, 76, 0.42);
  }

  .marker.is-muted .marker-button,
  .marker.is-muted .marker-chip {
    opacity: 0.7;
  }

  .marker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(1.25rem * var(--marker-scale, 1));
    height: calc(1.25rem * var(--marker-scale, 1));
    min-width: calc(1.25rem * var(--marker-scale, 1));
    min-height: calc(1.25rem * var(--marker-scale, 1));
    border-radius: 0;
    background: transparent;
    margin: 0;
    padding: 0;
    line-height: 0;
  }

  .marker-icon ha-icon {
    --mdc-icon-size: calc(1.25rem * var(--marker-scale, 1));
    display: block;
    width: calc(1.25rem * var(--marker-scale, 1));
    height: calc(1.25rem * var(--marker-scale, 1));
    margin: 0;
    padding: 0;
    line-height: 0;
    transform: translate(0, 0);
  }

  .placement-hint {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    padding: 0.5rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--floormap-accent) 18%, var(--floormap-surface));
    border: 1px solid color-mix(in srgb, var(--floormap-accent) 45%, transparent);
    color: inherit;
    backdrop-filter: blur(8px);
  }
`;
function fireEvent(node, type, detail, options) {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options?.bubbles ?? true,
      cancelable: options?.cancelable ?? false,
      composed: options?.composed ?? true
    })
  );
}
function defineOnce(tagName, ctor) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ctor);
  }
}
function decodeEntityRegistryEntry(entry) {
  const entityId = asString2(entry.ei) ?? asString2(entry.entity_id) ?? asString2(entry.eid) ?? asString2(entry.entityId) ?? asString2(entry.id);
  if (!entityId) {
    return null;
  }
  const name = asString2(entry.en) ?? asString2(entry.display_name) ?? asString2(entry.dn) ?? asString2(entry.name) ?? asString2(entry.n) ?? asString2(entry.original_name) ?? asString2(entry.on) ?? entityId;
  const icon = asString2(entry.ic) ?? asString2(entry.icon) ?? asString2(entry.i) ?? void 0;
  return { entity_id: entityId, name, icon };
}
function asString2(value) {
  return typeof value === "string" && value.trim() ? value : void 0;
}
function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function entityIsActive(stateObj) {
  return Boolean(stateObj && stateObj.state === "on");
}
function entityIsFan(entityId) {
  return entityId.startsWith("fan.");
}
function fanSupportsPercentage(serviceIds) {
  return serviceIds.includes("fan.set_percentage");
}
function fanPercentageStep(stateObj) {
  const explicitStep = asNumber(stateObj?.attributes.percentage_step);
  if (explicitStep && explicitStep > 0) {
    return explicitStep;
  }
  const speedCount = asNumber(stateObj?.attributes.speed_count);
  if (speedCount && speedCount > 1) {
    return Math.max(1, Math.round(100 / speedCount));
  }
  return 1;
}
function fanPercentageValue(stateObj) {
  const percentage = asNumber(stateObj?.attributes.percentage);
  if (percentage !== void 0) {
    return Math.min(100, Math.max(0, Math.round(percentage)));
  }
  return stateObj?.state === "on" ? 100 : 0;
}
function appendCacheBuster(path, layout) {
  const marker = layout.image?.updated_at ?? Date.now().toString();
  return `${path}${path.includes("?") ? "&" : "?"}ts=${encodeURIComponent(marker)}`;
}
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read floor plan file"));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Unable to read floor plan file"));
    reader.readAsDataURL(file);
  });
}
var FloorMapBaseElement = class extends i4 {
  constructor() {
    super(...arguments);
    this._layout = null;
    this._imageUrl = null;
    this._loading = false;
    this._error = null;
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
    this._surfaceWidth = 0;
    this._surfaceHeight = 0;
    this._initialized = false;
  }
  static {
    this.properties = {
      hass: { attribute: false },
      _layout: { state: true },
      _imageUrl: { state: true },
      _loading: { state: true },
      _error: { state: true },
      _scale: { state: true },
      _panX: { state: true },
      _panY: { state: true },
      _surfaceWidth: { state: true },
      _surfaceHeight: { state: true }
    };
  }
  static {
    this.styles = [baseStyles];
  }
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      void this._initialize();
    }
    this._ensureSurfaceObservation();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._resizeObserver?.disconnect();
  }
  async _initialize() {
    await this._loadLayout();
    await this._subscribeToLayoutUpdates();
    await this._afterInitialize();
  }
  async _afterInitialize() {
    return Promise.resolve();
  }
  async _afterLayoutLoad(_layout) {
    return Promise.resolve();
  }
  async _loadLayout() {
    if (!this.hass) {
      return;
    }
    this._loading = true;
    this._error = null;
    try {
      const layout = await this.hass.callWS({ type: GET_LAYOUT_COMMAND });
      this._layout = layout;
      this._imageUrl = await this._resolveImageUrl(layout);
      await this._afterLayoutLoad(layout);
    } catch (error) {
      this._layout = null;
      this._imageUrl = null;
      this._error = error instanceof Error ? error.message : "Unable to load FloorMap data";
    } finally {
      this._loading = false;
    }
  }
  async _resolveImageUrl(layout) {
    if (!layout.image) {
      return null;
    }
    if (layout.image_data_url) {
      return layout.image_data_url;
    }
    return this._signFloorplanUrl(layout);
  }
  _resetView() {
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
  }
  _zoom(delta) {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this._scale + delta));
    this._scale = nextScale;
  }
  _aspectRatio() {
    const width = this._layout?.image?.width;
    const height = this._layout?.image?.height;
    if (width && height) {
      return `${width} / ${height}`;
    }
    return "16 / 9";
  }
  _transformState() {
    return { scale: this._scale, panX: this._panX, panY: this._panY };
  }
  _onWheel(event) {
    event.preventDefault();
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    const rect = surface.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const nextScale = this._scale + (event.deltaY < 0 ? 0.2 : -0.2);
    const nextTransform = zoomAroundPoint(this._transformState(), anchorX, anchorY, nextScale);
    this._scale = nextTransform.scale;
    this._panX = nextTransform.panX;
    this._panY = nextTransform.panY;
  }
  async _subscribeToLayoutUpdates() {
    if (!this.hass?.connection?.subscribeEvents) {
      return;
    }
    this._unsubscribe = await this.hass.connection.subscribeEvents(
      async () => {
        await this._loadLayout();
      },
      EVENT_LAYOUT_UPDATED
    );
  }
  async _signFloorplanUrl(layout) {
    const signed = await this.hass.callWS({
      type: "auth/sign_path",
      path: layout.image_url ?? FLOORPLAN_API_PATH,
      expires: 120
    });
    return appendCacheBuster(signed.path, layout);
  }
  _mapSurface() {
    return this.renderRoot.querySelector(".map-surface");
  }
  _mapStage() {
    return this.renderRoot.querySelector(".map-stage");
  }
  _imageStageStyle() {
    if (!this._surfaceWidth || !this._surfaceHeight) {
      return "left:0; top:0; width:100%; height:100%;";
    }
    const imageWidth = this._layout?.image?.width ?? 16;
    const imageHeight = this._layout?.image?.height ?? 9;
    const imageAspect = imageWidth / imageHeight;
    const surfaceAspect = this._surfaceWidth / this._surfaceHeight;
    let width = this._surfaceWidth;
    let height = this._surfaceHeight;
    let left = 0;
    let top = 0;
    if (surfaceAspect > imageAspect) {
      height = this._surfaceHeight;
      width = height * imageAspect;
      left = (this._surfaceWidth - width) / 2;
    } else {
      width = this._surfaceWidth;
      height = width / imageAspect;
      top = (this._surfaceHeight - height) / 2;
    }
    return `left:${left}px; top:${top}px; width:${width}px; height:${height}px;`;
  }
  _normalizedPointFromClient(clientX, clientY) {
    const stage = this._mapStage();
    if (!stage) {
      return null;
    }
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }
    return {
      x: clampCoordinate((clientX - rect.left) / rect.width),
      y: clampCoordinate((clientY - rect.top) / rect.height)
    };
  }
  _ensureSurfaceObservation() {
    const surface = this._mapSurface();
    if (!surface || surface === this._observedSurface) {
      return;
    }
    this._resizeObserver?.disconnect();
    this._observedSurface = surface;
    this._resizeObserver = new ResizeObserver((entries) => {
      const rect2 = entries[0]?.contentRect;
      if (!rect2) {
        return;
      }
      this._surfaceWidth = rect2.width;
      this._surfaceHeight = rect2.height;
    });
    this._resizeObserver.observe(surface);
    const rect = surface.getBoundingClientRect();
    this._surfaceWidth = rect.width;
    this._surfaceHeight = rect.height;
  }
};
var FloorMapCardEditor = class extends i4 {
  constructor() {
    super(...arguments);
    this._config = { type: "custom:floor-map", show_labels: false };
  }
  static {
    this.properties = {
      hass: { attribute: false },
      _config: { state: true }
    };
  }
  static {
    this.styles = [
      baseStyles,
      i`
      :host {
        padding: 0.5rem 0;
      }

      .editor {
        display: grid;
        gap: 0.75rem;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
    `
    ];
  }
  setConfig(config) {
    this._config = { type: "custom:floor-map", show_labels: Boolean(config.show_labels) };
  }
  render() {
    return b2`
      <div class="editor">
        <div class="muted">Add it with <code>type: custom:floor-map</code>. For a full-page floor plan, place it in a Home Assistant Panel view.</div>
      </div>
    `;
  }
};
var FloorMapCard = class extends FloorMapBaseElement {
  constructor() {
    super(...arguments);
    this._config = { type: "custom:floor-map", show_labels: false };
    this._actionCache = /* @__PURE__ */ new Map();
    this._isPanning = false;
    this._fanSliderEntityId = null;
    this._fanSliderValue = null;
    this._pendingFanClicks = /* @__PURE__ */ new Map();
    this._onMarkerPointerMove = (event) => {
      if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
        return;
      }
      const movedX = event.clientX - this._markerPressState.startX;
      const movedY = event.clientY - this._markerPressState.startY;
      if (Math.hypot(movedX, movedY) >= MARKER_LONG_PRESS_MOVE_THRESHOLD) {
        this._clearMarkerPressState(event);
      }
    };
    this._onMarkerPointerLeave = (event) => {
      if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
        return;
      }
      this._clearMarkerPressState(event);
    };
    this._onMarkerPointerEnd = (event) => {
      if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId) {
        return;
      }
      this._clearMarkerPressState(event);
    };
    this._onFanSliderEnter = () => {
      this._clearFanSliderHideTimeout();
    };
    this._onFanSliderLeave = () => {
      this._scheduleFanSliderHide();
    };
  }
  static {
    this.properties = {
      ...FloorMapBaseElement.properties,
      _config: { state: true },
      _isPanning: { state: true },
      _fanSliderEntityId: { state: true },
      _fanSliderValue: { state: true }
    };
  }
  static {
    this.styles = [
      baseStyles,
      i`
      ha-card {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 0.75rem;
        padding: 0.9rem;
        min-height: clamp(560px, 78vh, 1080px);
        height: 100%;
      }

      .map-shell,
      .map-frame,
      .map-surface {
        height: 100%;
      }

      .map-surface {
        min-height: clamp(480px, 72vh, 980px);
        aspect-ratio: auto;
      }

      .marker.is-fan-slider {
        transform: translate(-50%, -50%);
        z-index: 3;
      }

      .fan-slider-shell {
        display: grid;
        gap: 0.45rem;
        width: min(12rem, max(9rem, calc(9.5rem * var(--marker-scale, 1))));
        padding: 0.7rem 0.8rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--floormap-accent) 28%, var(--floormap-outline));
        background: color-mix(in srgb, var(--floormap-surface) 92%, white 8%);
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.3);
        backdrop-filter: blur(14px);
        cursor: default;
      }

      .fan-slider-top {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .fan-slider-top .marker-icon {
        width: 1rem;
        height: 1rem;
        min-width: 1rem;
        min-height: 1rem;
      }

      .fan-slider-top .marker-icon ha-icon {
        --mdc-icon-size: 1rem;
        width: 1rem;
        height: 1rem;
      }

      .fan-slider-value {
        margin-left: auto;
        font-size: 0.78rem;
        color: var(--floormap-muted);
        font-variant-numeric: tabular-nums;
      }

      .fan-slider-input {
        width: 100%;
        margin: 0;
      }
    `
    ];
  }
  static getConfigElement() {
    return document.createElement("floor-map-card-editor");
  }
  static getStubConfig() {
    return { show_labels: false };
  }
  setConfig(config) {
    this._config = {
      type: "custom:floor-map",
      show_labels: Boolean(config.show_labels)
    };
  }
  getCardSize() {
    return 12;
  }
  render() {
    return b2`
      <ha-card>
        <div class="toolbar">
          <button @click=${() => this._zoom(0.2)}>Zoom in</button>
          <button @click=${() => this._zoom(-0.2)}>Zoom out</button>
          <button @click=${this._resetView}>Reset</button>
          <div class="toolbar-spacer"></div>
          <span class="muted">FloorMap</span>
        </div>
        ${this._renderMap()}
      </ha-card>
    `;
  }
  _renderMap() {
    if (this._loading) {
      return b2`<div class="empty-state">Loading floor plan…</div>`;
    }
    if (this._error) {
      return b2`<div class="empty-state">${this._error}</div>`;
    }
    if (!this._layout?.image || !this._imageUrl) {
      return b2`<div class="empty-state">Open the FloorMap sidebar page to upload a floor plan and place entities.</div>`;
    }
    return b2`
      <div class="map-shell">
        <div class="map-frame">
          <div
            class="map-surface ${this._isPanning ? "panning" : ""}"
            style=${`--floormap-aspect-ratio:${this._aspectRatio()};`}
            @wheel=${this._onWheel}
            @pointerdown=${this._onPanStart}
            @pointermove=${this._onPanMove}
            @pointerup=${this._onPanEnd}
            @pointercancel=${this._onPanEnd}
          >
            <div
              class="map-transform"
              style=${`transform: translate(${this._panX}px, ${this._panY}px) scale(${this._scale});`}
            >
              <div class="map-stage" style=${this._imageStageStyle()}>
                <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
                <div class="markers">
                  ${this._layout.placements.map((placement) => this._renderCardMarker(placement))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _renderCardMarker(placement) {
    const stateObj = this.hass?.states[placement.entity_id];
    const icon = entityIcon(placement.entity_id, stateObj, void 0);
    const label = entityLabel(stateObj, void 0, placement.entity_id);
    const isLight = entityUsesLampPalette(placement.entity_id, stateObj, void 0);
    const isFanSlider = this._fanSliderEntityId === placement.entity_id;
    const markerClasses = [
      "marker",
      isLight ? "is-light" : "",
      isFanSlider ? "is-fan-slider" : "",
      entityIsActive(stateObj) ? "is-active" : "",
      stateObj ? "" : "is-muted"
    ].filter(Boolean).join(" ");
    if (isFanSlider) {
      const sliderValue = this._fanSliderValue ?? fanPercentageValue(stateObj);
      const sliderStep = fanPercentageStep(stateObj);
      return b2`
        <div
          class=${markerClasses}
          style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
        >
          <div
            class="fan-slider-shell"
            role="group"
            aria-label=${`${label} speed control`}
            @mouseenter=${this._onFanSliderEnter}
            @mouseleave=${this._onFanSliderLeave}
            @pointerdown=${this._onFanSliderEnter}
            @pointerleave=${this._onFanSliderLeave}
          >
            <div class="fan-slider-top">
              <span class="marker-icon"><ha-icon .icon=${icon}></ha-icon></span>
              <span class="fan-slider-value">${sliderValue}%</span>
            </div>
            <input
              class="fan-slider-input"
              type="range"
              min="0"
              max="100"
              step=${String(sliderStep)}
              .value=${String(sliderValue)}
              @input=${(event) => this._onFanSliderInput(event)}
              @change=${(event) => this._onFanSliderCommit(placement.entity_id, event)}
            />
          </div>
        </div>
      `;
    }
    return b2`
      <div
        class=${markerClasses}
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
      >
        <button
          class="marker-button"
          title=${label}
          aria-label=${label}
          @pointerdown=${(event) => this._onMarkerPointerDown(placement.entity_id, event)}
          @pointermove=${this._onMarkerPointerMove}
          @pointerup=${this._onMarkerPointerEnd}
          @pointercancel=${this._onMarkerPointerEnd}
          @pointerleave=${this._onMarkerPointerLeave}
          @click=${(event) => this._onMarkerClick(placement.entity_id, event)}
          @dblclick=${(event) => this._onMarkerDoubleClick(placement.entity_id, event)}
        >
          <span class="marker-icon"><ha-icon .icon=${icon}></ha-icon></span>
        </button>
      </div>
    `;
  }
  _onMarkerPointerDown(entityId, event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    this._clearMarkerPressState();
    const button = event.currentTarget;
    button?.setPointerCapture(event.pointerId);
    const timeoutId = window.setTimeout(() => {
      if (!this._markerPressState || this._markerPressState.pointerId !== event.pointerId || this._markerPressState.entityId !== entityId) {
        return;
      }
      this._suppressedClick = {
        entityId,
        until: Date.now() + 800
      };
      this._openMoreInfo(entityId);
    }, MARKER_LONG_PRESS_MS);
    this._markerPressState = {
      pointerId: event.pointerId,
      entityId,
      startX: event.clientX,
      startY: event.clientY,
      timeoutId
    };
  }
  _onMarkerClick(entityId, event) {
    if (this._suppressedClick?.entityId === entityId && this._suppressedClick.until > Date.now()) {
      this._suppressedClick = void 0;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this._fanSliderEntityId === entityId) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (entityIsFan(entityId)) {
      const existingTimer = this._pendingFanClicks.get(entityId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }
      const timerId = window.setTimeout(() => {
        this._pendingFanClicks.delete(entityId);
        void this._handleEntityTap(entityId);
      }, FAN_DOUBLE_CLICK_DELAY_MS);
      this._pendingFanClicks.set(entityId, timerId);
      return;
    }
    void this._handleEntityTap(entityId);
  }
  _onMarkerDoubleClick(entityId, event) {
    event.preventDefault();
    event.stopPropagation();
    const pendingClick = this._pendingFanClicks.get(entityId);
    if (pendingClick) {
      window.clearTimeout(pendingClick);
      this._pendingFanClicks.delete(entityId);
    }
    void this._openFanSlider(entityId);
  }
  async _handleEntityTap(entityId) {
    if (!this.hass) {
      return;
    }
    const stateObj = this.hass.states[entityId];
    const serviceIds = await this._serviceIdsForEntity(entityId);
    const action = resolveEntityAction(serviceIds, entityId, stateObj?.state);
    if (action) {
      await this.hass.callService(action.domain, action.service, { entity_id: entityId });
      return;
    }
    this._openMoreInfo(entityId);
  }
  async _serviceIdsForEntity(entityId) {
    if (this._actionCache.has(entityId)) {
      return this._actionCache.get(entityId);
    }
    const serviceIds = await this.hass.callWS({
      type: "get_services_for_target",
      target: { entity_id: [entityId] },
      expand_group: false
    });
    this._actionCache.set(entityId, serviceIds);
    return serviceIds;
  }
  _onPanStart(event) {
    const target = event.target;
    if (target.closest(".marker-button") || target.closest(".fan-slider-shell")) {
      return;
    }
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    this._panState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: this._panX,
      startPanY: this._panY
    };
    this._isPanning = true;
    surface.setPointerCapture(event.pointerId);
  }
  _onPanMove(event) {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    this._panX = this._panState.startPanX + (event.clientX - this._panState.startX);
    this._panY = this._panState.startPanY + (event.clientY - this._panState.startY);
  }
  _onPanEnd(event) {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    const surface = this._mapSurface();
    surface?.releasePointerCapture(event.pointerId);
    this._panState = void 0;
    this._isPanning = false;
  }
  _clearMarkerPressState(event) {
    if (!this._markerPressState) {
      return;
    }
    window.clearTimeout(this._markerPressState.timeoutId);
    if (event?.currentTarget instanceof HTMLElement) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
      }
    }
    this._markerPressState = void 0;
  }
  _openMoreInfo(entityId) {
    if (!this.hass?.states[entityId]) {
      return;
    }
    fireEvent(this, "hass-more-info", { entityId });
  }
  async _openFanSlider(entityId) {
    if (!this.hass || !entityIsFan(entityId)) {
      return;
    }
    const serviceIds = await this._serviceIdsForEntity(entityId);
    if (!fanSupportsPercentage(serviceIds)) {
      return;
    }
    this._clearFanSliderHideTimeout();
    this._fanSliderEntityId = entityId;
    this._fanSliderValue = fanPercentageValue(this.hass.states[entityId]);
  }
  _onFanSliderInput(event) {
    const input = event.currentTarget;
    if (!input) {
      return;
    }
    this._clearFanSliderHideTimeout();
    this._fanSliderValue = Math.min(100, Math.max(0, Number(input.value)));
  }
  async _onFanSliderCommit(entityId, event) {
    const input = event.currentTarget;
    if (!input || !this.hass) {
      return;
    }
    this._clearFanSliderHideTimeout();
    const percentage = Math.min(100, Math.max(0, Math.round(Number(input.value))));
    this._fanSliderValue = percentage;
    await this.hass.callService("fan", "set_percentage", {
      entity_id: entityId,
      percentage
    });
  }
  _scheduleFanSliderHide() {
    this._clearFanSliderHideTimeout();
    this._fanSliderHideTimeout = window.setTimeout(() => {
      this._fanSliderEntityId = null;
      this._fanSliderValue = null;
      this._fanSliderHideTimeout = void 0;
    }, FAN_SLIDER_HIDE_DELAY_MS);
  }
  _clearFanSliderHideTimeout() {
    if (this._fanSliderHideTimeout === void 0) {
      return;
    }
    window.clearTimeout(this._fanSliderHideTimeout);
    this._fanSliderHideTimeout = void 0;
  }
};
var FloorMapPanel = class extends FloorMapBaseElement {
  constructor() {
    super(...arguments);
    this._entities = [];
    this._query = "";
    this._draftPlacements = [];
    this._pendingEntityId = null;
    this._saving = false;
    this._uploading = false;
    this._dirty = false;
    this._isPanning = false;
    this._cancelPendingPlacement = () => {
      this._pendingEntityId = null;
    };
  }
  static {
    this.properties = {
      ...FloorMapBaseElement.properties,
      _entities: { state: true },
      _query: { state: true },
      _draftPlacements: { state: true },
      _pendingEntityId: { state: true },
      _saving: { state: true },
      _uploading: { state: true },
      _dirty: { state: true },
      _isPanning: { state: true }
    };
  }
  static {
    this.styles = [
      baseStyles,
      i`
      :host {
        min-height: 100%;
      }

      .panel {
        display: grid;
        grid-template-columns: minmax(280px, 340px) 1fr;
        min-height: calc(100vh - 80px);
      }

      .sidebar {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        border-right: 1px solid var(--floormap-outline);
        background: color-mix(in srgb, var(--floormap-surface) 82%, black 18%);
      }

      .section {
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }

      .section h2,
      .section h3 {
        margin: 0;
        font-size: 0.98rem;
      }

      .main {
        display: grid;
        gap: 1rem;
        padding: 1rem;
      }

      .panel-map {
        min-height: 500px;
      }

      .entity-list,
      .placed-list {
        display: grid;
        gap: 0.5rem;
        max-height: 320px;
        overflow: auto;
      }

      .entity-row,
      .placed-row {
        display: grid;
        gap: 0.45rem;
        padding: 0.7rem;
        border: 1px solid var(--floormap-outline);
        border-radius: 8px;
        background: color-mix(in srgb, var(--floormap-surface) 88%, white 12%);
      }

      .entity-row-top,
      .placed-row-top {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .entity-meta,
      .placed-meta {
        min-width: 0;
        flex: 1 1 auto;
      }

      .entity-name,
      .placed-name {
        font-weight: 600;
      }

      .entity-id,
      .placed-id {
        font-size: 0.78rem;
        color: var(--floormap-muted);
        word-break: break-all;
      }

      .row-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
      }

      .size-row {
        display: grid;
        gap: 0.4rem;
      }

      .size-row label {
        font-size: 0.82rem;
        color: var(--floormap-muted);
      }

      .size-input {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: center;
      }

      .size-value {
        min-width: 2.4rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--floormap-muted);
      }

      .map-frame {
        min-height: 500px;
      }

      .map-surface {
        min-height: 500px;
      }

      .marker-chip {
        cursor: grab;
        touch-action: none;
      }

      .marker-chip:active {
        cursor: grabbing;
      }

      .status-banner {
        padding: 0.6rem 0.8rem;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--floormap-accent) 38%, transparent);
        background: color-mix(in srgb, var(--floormap-accent) 14%, var(--floormap-surface));
      }

      @media (max-width: 1100px) {
        .panel {
          grid-template-columns: 1fr;
        }

        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--floormap-outline);
        }
      }
    `
    ];
  }
  async _afterInitialize() {
    await this._loadEntityIndex();
  }
  async _afterLayoutLoad(layout) {
    this._draftPlacements = layout.placements.map((placement) => ({ ...placement }));
    this._dirty = false;
    this._pendingEntityId = null;
    this._resetView();
  }
  render() {
    return b2`
      <div class="panel">
        <aside class="sidebar">
          <section class="section">
            <h2>FloorMap</h2>
            <div class="muted">
              Upload one floor plan, place entities on it, and save the shared layout.
            </div>
          </section>

          <section class="section">
            <h3>Floor plan</h3>
            <label class="row-actions">
              <input
                type="file"
                accept="image/png,image/jpeg"
                @change=${this._onUploadFloorplan}
                ?disabled=${this._uploading}
              />
            </label>
            <div class="muted">
              ${this._layout?.image ? `Current file: ${this._layout.image.filename}` : "No floor plan uploaded yet."}
            </div>
          </section>

          <section class="section">
            <h3>Add entity</h3>
            <input
              type="search"
              placeholder="Search entities"
              .value=${this._query}
              @input=${this._onQueryInput}
            />
            <div class="entity-list">
              ${this._filteredEntities().map((entry) => this._renderEntityRow(entry))}
            </div>
          </section>

          <section class="section">
            <h3>Placed entities</h3>
            <div class="muted">Drag markers on the map to reposition them. Use the size slider to control how large they appear in the viewer.</div>
            <div class="placed-list">
              ${this._draftPlacements.length ? this._draftPlacements.map((placement) => this._renderPlacedRow(placement)) : b2`<div class="muted">No entities placed yet.</div>`}
            </div>
          </section>
        </aside>

        <main class="main">
          <div class="toolbar">
            <button @click=${() => this._zoom(0.2)}>Zoom in</button>
            <button @click=${() => this._zoom(-0.2)}>Zoom out</button>
            <button @click=${this._resetView}>Reset</button>
            <div class="toolbar-spacer"></div>
            ${this._pendingEntityId ? b2`
                  <span class="status-banner">
                    Click the floor plan to place ${this._pendingEntityLabel()}.
                  </span>
                  <button @click=${this._cancelPendingPlacement}>Cancel</button>
                ` : A}
            <button
              class="primary"
              @click=${this._saveLayout}
              ?disabled=${this._saving || !this._dirty}
            >
              ${this._saving ? "Saving\u2026" : "Save layout"}
            </button>
          </div>
          ${this._renderEditorMap()}
        </main>
      </div>
    `;
  }
  _renderEditorMap() {
    if (this._loading) {
      return b2`<div class="empty-state">Loading floor plan…</div>`;
    }
    if (this._error) {
      return b2`<div class="empty-state">${this._error}</div>`;
    }
    if (!this._layout?.image || !this._imageUrl) {
      return b2`<div class="empty-state">Upload a PNG or JPG floor plan to start placing entities.</div>`;
    }
    return b2`
      <div class="map-shell panel-map">
        <div class="map-frame">
          <div
            class="map-surface ${this._isPanning ? "panning" : ""}"
            style=${`--floormap-aspect-ratio:${this._aspectRatio()};`}
            @wheel=${this._onWheel}
            @pointerdown=${this._onEditorPointerDown}
            @pointermove=${this._onEditorPointerMove}
            @pointerup=${this._onEditorPointerUp}
            @pointercancel=${this._onEditorPointerUp}
            @click=${this._onEditorMapClick}
          >
            ${this._pendingEntityId ? b2`<div class="placement-hint">Click to place ${this._pendingEntityLabel()}.</div>` : A}
            <div
              class="map-transform"
              style=${`transform: translate(${this._panX}px, ${this._panY}px) scale(${this._scale});`}
            >
              <div class="map-stage" style=${this._imageStageStyle()}>
                <img class="map-image" src=${this._imageUrl} alt="Floor plan" />
                <div class="markers">
                  ${this._draftPlacements.map((placement) => this._renderEditorMarker(placement))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _renderEntityRow(entry) {
    const stateObj = this.hass?.states[entry.entity_id];
    return b2`
      <div class="entity-row">
        <div class="entity-row-top">
          <span class="marker-icon"><ha-icon .icon=${entityIcon(entry.entity_id, stateObj, entry)}></ha-icon></span>
          <div class="entity-meta">
            <div class="entity-name">${entry.name}</div>
            <div class="entity-id">${entry.entity_id}</div>
          </div>
        </div>
        <div class="row-actions">
          <button @click=${() => this._startPlacement(entry.entity_id)}>Place</button>
        </div>
      </div>
    `;
  }
  _renderPlacedRow(placement) {
    const stateObj = this.hass?.states[placement.entity_id];
    const indexEntry = this._entityIndex(placement.entity_id);
    const label = entityLabel(stateObj, indexEntry, placement.entity_id);
    return b2`
      <div class="placed-row">
        <div class="placed-row-top">
          <span class="marker-icon"><ha-icon .icon=${entityIcon(placement.entity_id, stateObj, indexEntry)}></ha-icon></span>
          <div class="placed-meta">
            <div class="placed-name">${label}</div>
            <div class="placed-id">${placement.entity_id}</div>
          </div>
        </div>
        <div class="size-row">
          <label for=${`size-${placement.entity_id}`}>Marker size</label>
          <div class="size-input">
            <input
              id=${`size-${placement.entity_id}`}
              type="range"
              min="0.6"
              max="2.4"
              step="0.1"
              .value=${String(placement.size ?? 1)}
              @input=${(event) => this._updatePlacementSize(placement.entity_id, event)}
            />
            <span class="size-value">${(placement.size ?? 1).toFixed(1)}x</span>
          </div>
        </div>
        <div class="row-actions">
          <button @click=${() => this._removePlacement(placement.entity_id)}>Remove</button>
        </div>
      </div>
    `;
  }
  _renderEditorMarker(placement) {
    const stateObj = this.hass?.states[placement.entity_id];
    const indexEntry = this._entityIndex(placement.entity_id);
    const label = entityLabel(stateObj, indexEntry, placement.entity_id);
    const isLight = entityUsesLampPalette(placement.entity_id, stateObj, indexEntry);
    const markerClasses = [
      "marker",
      isLight ? "is-light" : "",
      entityIsActive(stateObj) ? "is-active" : "",
      stateObj ? "" : "is-muted"
    ].filter(Boolean).join(" ");
    return b2`
      <div
        class=${markerClasses}
        style=${`left:${placement.x * 100}%; top:${placement.y * 100}%; --marker-scale:${placement.size ?? 1};`}
      >
        <div
          class="marker-chip"
          data-entity-id=${placement.entity_id}
          title=${label}
          aria-label=${label}
        >
          <span class="marker-icon"><ha-icon .icon=${entityIcon(placement.entity_id, stateObj, indexEntry)}></ha-icon></span>
        </div>
      </div>
    `;
  }
  async _loadEntityIndex() {
    if (!this.hass) {
      return;
    }
    try {
      const payload = await this.hass.callWS({ type: "config/entity_registry/list_for_display" });
      const rows = Array.isArray(payload) ? payload : payload.entities ?? [];
      const decoded = rows.map((entry) => decodeEntityRegistryEntry(entry)).filter((entry) => entry !== null).sort((left, right) => left.name.localeCompare(right.name));
      this._entities = decoded.length ? decoded : this._fallbackEntitiesFromStates();
    } catch (error) {
      this._entities = this._fallbackEntitiesFromStates();
      if (!this._entities.length) {
        this._error = error instanceof Error ? error.message : "Unable to load entity list";
      }
    }
  }
  _fallbackEntitiesFromStates() {
    const states = this.hass?.states ?? {};
    return Object.values(states).map((stateObj) => ({
      entity_id: stateObj.entity_id,
      name: entityLabel(stateObj, void 0, stateObj.entity_id),
      icon: entityIcon(stateObj.entity_id, stateObj, void 0)
    })).sort((left, right) => left.name.localeCompare(right.name));
  }
  _filteredEntities() {
    const query = this._query.trim().toLowerCase();
    const placedIds = new Set(this._draftPlacements.map((placement) => placement.entity_id));
    return this._entities.filter((entry) => !placedIds.has(entry.entity_id)).filter((entry) => {
      if (!query) {
        return true;
      }
      return entry.name.toLowerCase().includes(query) || entry.entity_id.toLowerCase().includes(query);
    }).slice(0, 50);
  }
  _entityIndex(entityId) {
    return this._entities.find((entry) => entry.entity_id === entityId);
  }
  _startPlacement(entityId) {
    this._pendingEntityId = entityId;
  }
  _pendingEntityLabel() {
    if (!this._pendingEntityId) {
      return "entity";
    }
    return this._entityIndex(this._pendingEntityId)?.name ?? this._pendingEntityId;
  }
  _removePlacement(entityId) {
    this._draftPlacements = this._draftPlacements.filter(
      (placement) => placement.entity_id !== entityId
    );
    this._dirty = true;
  }
  _updatePlacementSize(entityId, event) {
    const target = event.currentTarget;
    const nextSize = Number.parseFloat(target.value);
    this._draftPlacements = this._draftPlacements.map(
      (placement) => placement.entity_id === entityId ? {
        ...placement,
        size: Number.isFinite(nextSize) ? Math.max(0.6, Math.min(2.4, nextSize)) : 1
      } : placement
    );
    this._dirty = true;
  }
  _onQueryInput(event) {
    this._query = event.currentTarget.value;
  }
  async _onUploadFloorplan(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this._uploading = true;
    this._error = null;
    try {
      const contentBase64 = await fileToBase64(file);
      const layout = await this.hass.callWS({
        type: UPLOAD_FLOORPLAN_COMMAND,
        file_name: file.name,
        media_type: file.type,
        content_base64: contentBase64
      });
      this._layout = layout;
      this._imageUrl = await this._resolveImageUrl(layout);
      await this._afterLayoutLoad(layout);
    } catch (error) {
      this._error = error instanceof Error ? error.message : "Unable to upload floor plan";
    } finally {
      this._uploading = false;
      input.value = "";
    }
  }
  async _saveLayout() {
    if (!this.hass) {
      return;
    }
    this._saving = true;
    this._error = null;
    try {
      const layout = await this.hass.callWS({
        type: SAVE_LAYOUT_COMMAND,
        placements: this._draftPlacements
      });
      this._layout = layout;
      this._dirty = false;
    } catch (error) {
      this._error = error instanceof Error ? error.message : "Unable to save layout";
    } finally {
      this._saving = false;
    }
  }
  _onEditorPointerDown(event) {
    const marker = event.target.closest(".marker-chip");
    const surface = this._mapSurface();
    if (!surface) {
      return;
    }
    if (marker) {
      const entityId = marker.dataset.entityId;
      if (!entityId) {
        return;
      }
      this._panState = { mode: "marker", pointerId: event.pointerId, entityId };
      event.preventDefault();
      surface.setPointerCapture(event.pointerId);
      return;
    }
    this._panState = {
      mode: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: this._panX,
      startPanY: this._panY
    };
    this._isPanning = true;
    surface.setPointerCapture(event.pointerId);
  }
  _onEditorPointerMove(event) {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    if (this._panState.mode === "pan") {
      this._panX = this._panState.startPanX + (event.clientX - this._panState.startX);
      this._panY = this._panState.startPanY + (event.clientY - this._panState.startY);
      return;
    }
    const activeState = this._panState;
    if (activeState.mode !== "marker") {
      return;
    }
    const point = this._normalizedPointFromClient(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    this._draftPlacements = this._draftPlacements.map(
      (placement) => placement.entity_id === activeState.entityId ? { ...placement, x: point.x, y: point.y } : placement
    );
    this._dirty = true;
  }
  _onEditorPointerUp(event) {
    if (!this._panState || this._panState.pointerId !== event.pointerId) {
      return;
    }
    const surface = this._mapSurface();
    surface?.releasePointerCapture(event.pointerId);
    this._isPanning = false;
    this._panState = void 0;
  }
  _onEditorMapClick(event) {
    if (!this._pendingEntityId || !this._layout?.image) {
      return;
    }
    const target = event.target;
    if (target.closest(".marker-chip")) {
      return;
    }
    const point = this._normalizedPointFromClient(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    this._draftPlacements = [
      ...this._draftPlacements,
      {
        entity_id: this._pendingEntityId,
        x: point.x,
        y: point.y,
        show_state: false,
        size: 1
      }
    ];
    this._dirty = true;
    this._pendingEntityId = null;
  }
};
defineOnce("floor-map-card-editor", FloorMapCardEditor);
defineOnce("floor-map", FloorMapCard);
defineOnce("ha-panel-floormap", FloorMapPanel);
window.customCards = window.customCards || [];
if (!window.customCards.find((card) => card.type === "floor-map")) {
  window.customCards.push({
    type: "floor-map",
    name: "FloorMap",
    preview: false,
    description: "Render and control entities on a shared floor plan."
  });
}
