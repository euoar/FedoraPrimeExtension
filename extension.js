const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const ModalDialog = imports.ui.modalDialog;
const EndSessionDialog = imports.ui.endSessionDialog;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const GnomeSession = imports.misc.gnomeSession;
const LOGOUT_MODE_NORMAL = 0;

var tarjeta, contenido, salida;

const PrimeMenuItem = new Lang.Class({
    Name: 'PrimeMenuItem.PrimeMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(text, icon_name, gicon, callback) {
        this.parent(0.0, text);

        let icon_cfg = { style_class: 'popup-menu-icon' };
        if (icon_name != null) {
          icon_cfg.icon_name = icon_name;
        } else if (gicon != null) {
          icon_cfg.gicon = gicon;
        }
        this.icon = new St.Icon(icon_cfg);
        this.actor.add_child(this.icon);
        this.label = new St.Label({ text: text });
        this.actor.add_child(this.label);
        this.connect('activate', callback);
    },

    destroy: function() {
        this.parent();
    }
});


const PrimeMenu = new Lang.Class({
    Name: 'PrimeMenu.PrimeMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, _("Nvidia"));
        this.nvidiaIcon = new St.Icon({ icon_name: 'nvidia-settings-icon-gnu',
                                       style_class: 'popup-menu-icon' })
        this.actor.add_actor(this.nvidiaIcon);
        this.xorg_file = Gio.file_new_for_path('/etc/X11/');
        this._addMenuItems();
        this._whatCard();
        this._setupWatch();

    },
    
    _whatCard: function() {
		if (GLib.file_test('/etc/X11/xorg.conf', GLib.FileTest.EXISTS)) {
		    this.tarjeta = "intel";
		    this.contenido = "Cambiar a intel";
		    this.conmutador = "Nvidia";
		    this.activo = true;
		} else {
		    this.tarjeta = "nvidia";
		    this.contenido = "Cambiar a nvidia";
		    this.conmutador = "Nvidia";
		    this.activo = false;
		}
    },
    
    _addMenuItems: function() {
    	this._whatCard();
        this.control = new PopupMenu.PopupSwitchMenuItem(_("Nvidia"), this.activo);
        this.menu.addMenuItem(this.control, 1);
        this.control.connect('toggled', Lang.bind(this, function() {
        	this.err = null;
          	if (this.tarjeta == "intel"){

          		this.err = Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'intel']);
        	}else if (this.tarjeta == "nvidia"){
        		this.err = Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'nvidia']);
        	}
         }));
    },
    
    destroy: function() {
        this.parent();
    },

    _setupWatch: function() {
        this.monitor = this.xorg_file.monitor_directory(0, null, null);
        this.monitor.connect('changed', Lang.bind(this, this._onXorgChange));
    },
      
    _onXorgChange: function() {
      	this._whatCard();
      	var sessionManager = new GnomeSession.SessionManager();
      	sessionManager.LogoutRemote(LOGOUT_MODE_NORMAL);
    }

});

function init(extensionMeta) {
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

let _indicator;

function enable() {
  _indicator = new PrimeMenu();
  Main.panel.addToStatusArea('nvidia_button', _indicator);
}

function disable() {
  _indicator.destroy();
}
