


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

const Gettext = imports.gettext.domain("gnome-shell-trash-extension");
const _ = Gettext.gettext;

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
        this._addConstMenuItems();
        this._onXorgChange();
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
    
    _addConstMenuItems: function() {
    	this._whatCard();
        this.control = new PopupMenu.PopupSwitchMenuItem(_("Nvidia"), this.activo);
 /*       if(this.tarjeta="intel"){
        	//this.control.toggle();
        	control.setToggleState(this.activo);
        }else {
        	control.setToggleState(this.activo);
        }*/
        this.menu.addMenuItem(this.control, 1);
        this.control.connect('toggled', Lang.bind(this, function() {
/*        	if (this.tarjeta == "intel"){
        		//let [res, out, err, statatus] = GLib.spawn_command_line_sync("pkexec bash '/usr/sbin/fedora-prime-select intel'");
        		Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'intel']);
        	}else if (this.tarjeta == "nvidia"){
        		Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'nvidia']);
        	}*/
        	this.err = null;
          	if (this.tarjeta == "intel"){

          		this.err = Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'intel']);
          		//this.salida = GLib.g_spawn_command_line_async("pkexec '/usr/bin/bash /usr/sbin/fedora-prime-select intel'");
        	}else if (this.tarjeta == "nvidia"){
        		//this.salida = GLib.g_spawn_command_line_async('pkexec /usr/bin/bash /usr/sbin/fedora-prime-select nvidia');
        		this.err = Util.spawn(['pkexec', 'bash', '/usr/sbin/fedora-prime-select', 'nvidia']);
        	}
        
        	
            //_onEmptyTrash();
         }));
    },
    
    destroy: function() {
        this.parent();
    },

    _setupWatch: function() {
        this.monitor = this.xorg_file.monitor_directory(0, null, null);
        this.monitor.connect('changed', Lang.bind(this, this._onXorgChange));
    },

	
    _onEmptyTrash: function() {
        new ConfirmEmptyTrashDialog(Lang.bind(this, this._doEmptyTrash)).open();
      },
      
    _onXorgChange: function() {
      	this._whatCard();
      	var sessionManager = new GnomeSession.SessionManager();
      	sessionManager.LogoutRemote(LOGOUT_MODE_NORMAL);

    }

});

const MESSAGE = _("Are you sure you want to delete all items from the trash?\n\
This operation cannot be undone.");

function ConfirmEmptyTrashDialog(emptyMethod) {
  this._init(emptyMethod);
}

ConfirmEmptyTrashDialog.prototype = {
  __proto__: ModalDialog.ModalDialog.prototype,

  _init: function(emptyMethod) {
    ModalDialog.ModalDialog.prototype._init.call(this, { styleClass: null });

    let mainContentBox = new St.BoxLayout({ style_class: 'polkit-dialog-main-layout',
                                            vertical: false });
    this.contentLayout.add(mainContentBox, { x_fill: true, y_fill: true });

    let messageBox = new St.BoxLayout({ style_class: 'polkit-dialog-message-layout',
                                        vertical: true });
    mainContentBox.add(messageBox, { y_align: St.Align.START });

    this._subjectLabel = new St.Label({ style_class: 'polkit-dialog-headline',
                                        text: _("Empty Trash?") });

    messageBox.add(this._subjectLabel, { y_fill:  false, y_align: St.Align.START });

    this._descriptionLabel = new St.Label({ style_class: 'polkit-dialog-description',
                                            text: Gettext.gettext(MESSAGE) });

    messageBox.add(this._descriptionLabel, { y_fill:  true, y_align: St.Align.START });

    this.setButtons([
      {
        label: _("Cancel"),
        action: Lang.bind(this, function() {
          this.close();
        }),
        key: Clutter.Escape
      },
      {
        label: _("Empty"),
        action: Lang.bind(this, function() {
          this.close();
          emptyMethod();
        })
      }
    ]);
  }
};

function init(extensionMeta) {
    imports.gettext.bindtextdomain("gnome-shell-trash-extension", extensionMeta.path + "/locale");
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



/*        this.open_item = new PrimeMenuItem(_(this.contenido),
"folder-open-symbolic",
null,
Lang.bind(this, this._onSwitchGpu));
this.menu.addMenuItem(this.open_item);*/
//let  control = new PopupMenu.PopupSwitchMenuItem(_(this.conmutador), "folder-open-symbolic");