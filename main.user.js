// ==UserScript==
// @name        Cuckoo
// @namespace   @NO_BOOT_DEVICE/Cuckoo
// @description It's like TweetDeck, but with updates!
// @include     https://tweetdeck.twitter.com/*
// @version     0.2
// @grant       none
// ==/UserScript==
window.Cuckoo = {};
if(typeof localStorage.cuckooSettings !== 'undefined') {
  try {
    window.Cuckoo.__settings = JSON.parse(localStorage.cuckooSettings);
  } catch(e) {
    console.log('error:',e)
    console.log('cuckoosettings',localStorage.cuckooSettings)
    if (e.name === 'SyntaxError') {
      alert('Your settings were corrupted, and have been reset. Sorry for the inconvenience.');      
      delete localStorage.cuckooSettings;
      location.reload();
    } else {
      alert('Something odd happened! Send @NO_BOOT_DEVICE a paste of your dev console output!');
    }
  }
} else {
  alert('Welcome to Cuckoo for TweetDeck! This is an alpha, if anything odd happens tell @NO_BOOT_DEVICE please.')
  alert('You have been given some default settings, go to the gear > Settings > Cuckoo to change them if you want.')
  window.Cuckoo.__settings = {analytics:true}
  localStorage.cuckooSettings = JSON.stringify(window.Cuckoo.__settings);
}
window.Cuckoo.settings = {
                    get: (function(name) {
                            return window.Cuckoo.__settings[name];
                          }),
                    set: (function(name, value) {
                            window.Cuckoo.__settings[name] = value
                            localStorage.cuckooSettings = JSON.stringify(window.Cuckoo.__settings)
                          })
                  }
TD.components.GlobalSettings.methods({
  _render: function() {
    return $(TD.ui.template.render('short_modal', {
      title: TD.i('Settings'),
      content: TD.ui.template.render('settings/global_settings_modal', this.getInfo()),
      hasDoneButton: !0,
      centeredFooter: !0
    }))
  },
  getInfo: function() {
    var e = {
      tabs: [{
        title: TD.i('General'),
        action: 'general'
      }, {
        title: TD.i('Link Shortening'),
        action: 'services'
      }, {
        title: TD.i('Mute'),
        action: 'filter'
      }, {
        title: 'Cuckoo',
        action: 'cuckoo'
      }]
    };
    return e
  },
  switchTab: function(e) {
    if (e !== this.currentTabName) {
      switch (this.$optionList.removeClass('selected'), this.currentTab && this.currentTab.destroy(), e) {
        case 'general':
          this.currentTab = new TD.components.GeneralSettings;
          break;
        case 'services':
          this.currentTab = new TD.components.ServicesSettings;
          break;
        case 'filter':
          this.currentTab = new TD.components.FilterSettings;
          break;
        case 'cuckoo':
          this.currentTab = new TD.components.CuckooSettings;
      }
      this.currentTabName = e, this.$optionList.find('[data-action=' + e + ']').parent('li').addClass('selected')
    }
  },
  destroy: function(e) {
    this.currentTab && this.currentTab.destroy(), $('#settings-modal').hide(), e && e.preventDefault(), this.supr()
  }
}) 
TD_mustaches['settings/global_setting_cuckoo.mustache'] = "<!-- Cuckoo -->\
<fieldset id='cuckoo_settings'>\
  <legend>Cuckoo for TweetDeck Settings</legend>\
  <div id='streaming-form' class='control-group'>\
    <div class='toggle-switch js-streaming-form enable-transition'>\
      <input id='cuckoo-twitter-analytics-toggle' class='toggle-switch-input' type='checkbox'>\
      <label for='cuckoo-twitter-analytics-toggle' class='toggle-switch-label'> <span class='toggle-switch-label-text'>Send Twitter Analytics</span> </label>\
    </div>\
  </div>\
</fieldset>"
TD.components.CuckooSettings = TD.components.Base.extend(function() {
  this.$node = $(TD.ui.template.render('settings/global_setting_cuckoo', {}))
  $('#global-settings').append(this.$node),
  this.$analyticsToggle = $("#cuckoo-twitter-analytics-toggle")
  this.$analyticsToggle.prop("checked", window.Cuckoo.settings.get('analytics'))
  this.$analyticsToggle.change(this.handleAnalyticsToggle.bind(this))
}).methods({
  handleAnalyticsToggle: function() {
    window.Cuckoo.settings.set('analytics', this.$analyticsToggle.prop("checked"))
  },
  destroy: function() {
    this.$node.remove()
  }
})
TD.metrics.send = _.wrap(TD.metrics.send, function(func, args) {
  if (window.Cuckoo.settings.get('analytics') === true) { 
    return func(args);
  } else {
    return undefined;
  }
})
window.ClientEvent = _.wrap(window.ClientEvent, function(f, a) { 
  clientevent = new f(a)
  clientevent.scribe = _.wrap(clientevent.scribe, function(func, args) { 
    if (window.Cuckoo.settings.get('analytics') === true) { 
      return func(args);
    } else {
      return undefined; 
    }
  })
  return clientevent
});
ClientEvent.prototype.constructor  = window.ClientEvent 
