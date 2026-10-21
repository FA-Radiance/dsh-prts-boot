/* eslint-disable */
/**
 * Preview host: takes the REAL client module's registration and renders the
 * `shell.overlay` component. Nothing in here is shipped with the plugin.
 */
;(function () {
  var React = window.React
  var ReactDOM = window.ReactDOM
  var module = window.__PRTS_MODULE__
  var host = document.getElementById('host')

  if (!module || typeof module.apply !== 'function') {
    host.textContent = 'client module did not register'
    return
  }

  var registrations = []

  // Fake DSH theme service: mirrors register/setTheme/overrideTokens and
  // projects the active theme's tokens onto <body> the way the real presenter
  // does, so CDP probes can verify the token set the real app would receive.
  var fakeTheme = {
    themes: [],
    preference: 'system',
    overrides: null,
    listeners: [],
    emit: function () {
      for (var i = 0; i < fakeTheme.listeners.length; i++) fakeTheme.listeners[i]()
    },
    register: function (definition) {
      fakeTheme.themes = fakeTheme.themes.filter(function (t) { return t.id !== definition.id })
      fakeTheme.themes.push(definition)
      console.log('[fake-theme] registered ' + definition.id + ' (' + definition.colorScheme + ', ' + Object.keys(definition.tokens).length + ' tokens)')
      return function () {
        fakeTheme.themes = fakeTheme.themes.filter(function (t) { return t.id !== definition.id })
      }
    },
    project: function (def) {
      if (!def) return
      document.documentElement.dataset.dsThemeSource = def.colorScheme
      if (def.colorScheme === 'dark') document.body.dataset.dsDarkTheme = ''
      else delete document.body.dataset.dsDarkTheme
      for (var key in def.tokens) document.body.style.setProperty(key, def.tokens[key])
      if (fakeTheme.overrides) {
        for (var okey in fakeTheme.overrides) document.body.style.setProperty(okey, fakeTheme.overrides[okey].light)
      }
    },
    setTheme: function (id) {
      fakeTheme.preference = id
      var def = null
      for (var i = 0; i < fakeTheme.themes.length; i++) if (fakeTheme.themes[i].id === id) def = fakeTheme.themes[i]
      document.documentElement.dataset.dsTheme = id
      fakeTheme.project(def)
      fakeTheme.emit()
      console.log('[fake-theme] applied ' + id)
    },
    overrideTokens: function (source, tokens) {
      fakeTheme.overrides = tokens
      var def = null
      for (var i = 0; i < fakeTheme.themes.length; i++) if (fakeTheme.themes[i].id === fakeTheme.preference) def = fakeTheme.themes[i]
      fakeTheme.project(def)
      fakeTheme.emit()
      console.log('[fake-theme] override layer from ' + source)
      return function () {
        fakeTheme.overrides = null
        fakeTheme.project(def)
      }
    },
    getTheme: function () {
      var active = null
      for (var i = 0; i < fakeTheme.themes.length; i++) if (fakeTheme.themes[i].id === fakeTheme.preference) active = fakeTheme.themes[i]
      return { preference: fakeTheme.preference, active: active }
    },
  }

  var ctx = {
    get: function (name) {
      return name === 'theme' ? fakeTheme : undefined
    },
    on: function (event, listener) {
      if (event === 'theme/change') fakeTheme.listeners.push(listener)
      return function () {
        var idx = fakeTheme.listeners.indexOf(listener)
        if (idx >= 0) fakeTheme.listeners.splice(idx, 1)
      }
    },
    slots: {
      inject: function (slot, run) {
        try {
          registrations.push({ slot: slot, registration: run() })
        } catch (error) {
          console.error('slot inject failed', slot, error)
        }
      },
      register: function (config, Component) {
        return { config: config, Component: Component }
      },
    },
  }

  window.__FAKE_THEME__ = fakeTheme

  module.apply(ctx)

  var wanted = new URLSearchParams(location.search).get('slot') || 'shell.overlay'
  var picked = registrations.filter(function (entry) {
    return entry.registration.config.name === wanted
  })[0]

  if (!picked) {
    host.textContent = 'no registration for slot: ' + wanted
    return
  }

  var Component = picked.registration.Component
  ReactDOM.createRoot(host).render(React.createElement(Component, {}))
})()
