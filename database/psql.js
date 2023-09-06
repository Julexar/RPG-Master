import pkg from "pg";
const Pool = pkg.Pool;
import "dotenv/config";
import moment from "moment"
import conf from "../config.js"
import fs from "fs";

class PSQL {
  constructor() {
    this.pool = new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_NAME,
      password: process.env.PG_PWD,
      port: process.env.PG_PORT
    });
    this.pool.connect((err) => {
      if (err) {
        this.writeDevLog(`${err}`);
      } else {
        this.writeDevLog("Connected to Database!");
      }
    });
  }

  query(query, params = []) {
    return new Promise((resolve, reject) => {
      this.pool.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (!query.includes("SELECT")) {
            resolve("Success");
          } else {
            results = JSON.parse(JSON.stringify(results.rows));
            resolve(results);
          }
        }
      });
    });
  }

  getServer(server) {
    return new Promise((resolve, reject) => {
      if (!server) {
        const sql = "SELECT * FROM servers";
        this.query(sql)
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Servers found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = "SELECT * FROM servers WHERE id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: Server not found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    })
  }

  addServer(server) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(reject("Error 409: Duplicate Server"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO servers (id, name, dm_role) VALUES ($1, $2, $3)";
            this.query(sql, [server.id, server.name, server.dm_role])
              .then(resolve(`Successfully added Server \"${server.name}\" to Database`))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remServer(server) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "DELETE FROM servers WHERE id = $1";
          this.query(sql, [server.id])
            .then(resolve(`Successfully removed Server \"${server.name}\" from Database`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateServer(server) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "UPDATE servers SET name = $1, dm_role = $2 WHERE id = $3";
          this.query(sql, [server.name, server.dm_role, server.id])
            .then(resolve(`Successfully updated Server \"${server.name}\" in Database`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  setDupSessions(server, bool) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "UPDATE servers SET dup_sessions = $1 WHERE id = $2";
          this.query(sql, [bool, server.id])
            .then(resolve(`Successfully set Channel for duplicate Sessions`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  setSumChannel(server, channel) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "UPDATE servers SET sum_chan = $1 WHERE id = $2";
          this.query(sql, [channel.id, server.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  setLogChannel(server, channel) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "UPDATE servers SET log_chan = $1 WHERE id = $2";
          this.query(sql, [channel.id, server.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  setGMEdit(server, bool) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "UPDATE servers SET gm_edit = $1 WHERE id = $2";
          this.query(sql, [bool, server.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    })
  }

  getStaffRole(server, type, role) {
    return new Promise((resolve, reject) => {
      if (!type && !role) {
        const sql = "SELECT admin_role, mod_role FROM servers WHERE id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Staff Roles found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else if (type && !role) {
        const sql = `SELECT ${type}_role FROM servers WHERE id = $1`;
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: Staff Role not found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  setStaffRole(server, type, role) {
    return new Promise((resolve, reject) => {
      this.getStaffRole(server, type)
        .then(r => {
          if ((r.admin_role || r.mod_role) && (r.admin_role == role.id || r.mod_role == role.id)) {
            reject("Error 409: Duplicate Staff Role");
          } else {
            const sql = `UPDATE servers SET ${type}_role = $1 WHERE id = $2`;
            this.query(sql, [role.id, server.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = `UPDATE servers SET ${type}_role = $1 WHERE id = $2`;
            this.query(sql, [role.id, server.id])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  getDMRole(server) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(() => {
          const sql = "SELECT dm_role FROM servers WHERE id = $1";
          this.query(sql, [server.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: No GM Role found");
              } else if (results.length === 1) {
                resolve(results[0].dm_role);
              }
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  setDMRole(server, role) {
    return new Promise((resolve, reject) => {
      this.getDMRole(server)
        .then(r => {
          if (r == role.id) {
            reject("Error 409: Duplicate GM Role");
          } else {
            const sql = "UPDATE servers SET dm_role = $1 WHERE id = $2";
            this.query(sql, [role.id, server.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "UPDATE servers SET dm_role = $1 WHERE id = $2";
            this.query(sql, [role.id, server.id])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  toggleLogs(server, bool) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(s => {
          const sql = "UPDATE servers SET print_logs = $1 WHERE id = $2";
          this.query(sql, [bool, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getGM(server, user) {
    return new Promise((resolve, reject) => {
      if (!user) {
        const sql = "SELECT * FROM gms WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No GMs found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = "SELECT * FROM gms WHERE server_id = $1 AND user_id = $2";
        this.query(sql, [server.id, user.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: GM not found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  addGM(server, user) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(reject("Error 409: Duplicate GM"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            let date = moment().format("YYYY-MM-DD HH:mm:ss");
            const sql = "INSERT INTO gms (server_id, user_id, date) VALUES ($1, $2, $3)";
            this.query(sql, [server.id, user.id, date])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remGM(server, user) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(() => {
          const sql = "DELETE FROM gms WHERE server_id = $1 AND user_id = $2";
          this.query(sql, [server.id, user.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  editGMXP(server, user, xp) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(gm => {
          if (gm.xp - xp < 0) {
            gm.xp = 0;
          } else {
            gm.xp += xp;
          }
          const sql = "UPDATE gms SET xp = $1 WHERE server_id = $2 AND user_id = $3";
          this.query(sql, [gm.xp, server.id, user.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  togGMSug(server, user) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(gm => {
          const sql = "UPDATE gms SET suggestions = $1 WHERE server_id = $2 AND user_id = $3";
          let bool;
          if (gm.suggestions) {
            bool = false;
          } else {
            bool = true;
          }
          this.query(sql, [bool, server.id, user.id])
            .then(resolve(`Successfully toggled receiving of Suggestions to ${bool}`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getPrefixes(server, prefix) {
    return new Promise((resolve, reject) => {
      if (!prefix) {
        const sql = "SELECT prefix FROM server_prefix WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              this.setPrefixDefault(server)
                .then(console.log)
                .catch(err => reject(err));
              resolve([conf.default_prefix]);
            } else if (results.length >= 1) {
              const prefixes = [];
              for (let i = 0; i < results.length; i++) {
                prefixes.push(results[i].prefix);
              }
              resolve(prefixes);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = "SELECT prefix FROM server_prefix WHERE server_id = $1 AND prefix = $2";
        this.query(sql, [server.id, prefix])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: Prefix not found");
            } else if (results.length === 1) {
              resolve(results[0].prefix);
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  setPrefixDefault(server) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO server_prefix (server_id, prefix) VALUES ($1, $2)";
      this.query(sql, [server.id, conf.default_prefix])
        .then(resolve(`Added default Prefix "${conf.default_prefix}" to Server "${server.name}"`))
        .catch(err => reject(err));
    });
  }

  addPrefix(server, prefix) {
    return new Promise((resolve, reject) => {
      this.getPrefixes(server, prefix)
        .then(reject("Error 409: Duplicate Prefix"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO server_prefix (server_id, prefix) VALUES ($1, $2)";
            this.query(sql, [server.id, prefix])
              .then(resolve(`Added Prefix "${prefix}" to Server "${server.name}"`))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    })
  }

  remPrefix(server, prefix) {
    return new Promise((resolve, reject) => {
      if (!prefix) {
        this.getPrefixes(server)
          .then(() => {
            const sql = "DELETE FROM server_prefix WHERE server_id = $1";
            this.query(sql, [server.id])
              .then(() => {
                this.setPrefixDefault(server)
                  .then(resolve("Success"))
                  .catch(err => reject(err));
              })
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      } else {
        this.getPrefixes(server, prefix)
          .then(() => {
            const sql = "DELETE FROM server_prefix WHERE server_id = $1 AND prefix = $2";
            this.query(sql, [server.id, prefix])
              .then(resolve("Success"))
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      }
    });
  }

  getCommand(cmd, type) {
    return new Promise((resolve, reject) => {
      if (!cmd) {
        const sql = "SELECT * FROM commands WHERE type = $1";
        this.query(sql, [type])
          .then(results => {
            if (results.length===0) {
              reject("Error 404: No Commands found");
            } else if (results.length>=1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (cmd.id) {
          const sql = "SELECT * FROM commands WHERE id = $1";
          this.query(sql, [cmd.id])
            .then(results => {
              if (results.length===0) {
                reject("Error 404: Command not found");
              } else if (results.length===1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM commands WHERE type = $1 AND name = $2";
          this.query(sql, [type, cmd.name])
            .then(results => {
              if (results.length===0) {
                reject("Error 404: Command not found");
              } else if (results.length===1) {
                resolve(results[0]);
              } else if (results.length>1) {
                resolve(results);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addCommand(cmd, type) {
    return new Promise((resolve, reject) => {
      this.getCommand(cmd, type)
        .then(reject("Error 409: Duplicate Command"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO commands VALUES($1, $2, $3, $4)";
            this.query(sql, [cmd.id, type, cmd.name, cmd.enabled])
              .then(resolve(`Successfully added ${type} Command \"${cmd.name}\" to Database!`))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCommand(cmd, type) {
    return new Promise((resolve, reject) => {
      this.getCommand(cmd, type)
        .then(c => {
          const sql = "DELETE FROM commands WHERE id = $1 AND type = $2";
          this.query(sql, [c.id, type])
            .then(resolve(`Successfully removed ${type} Command \"${c.name}\" from Database!`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    })
  }

  updateCommand(cmd, type) {
    return new Promise((resolve, reject) => {
      this.getCommand(cmd, type)
        .then(c => {
          const sql = "UPDATE commands SET name = $1, enabled = $2 WHERE id = $3";
          this.query(sql, [cmd.name, cmd.enabled, c.id])
            .then(resolve(`Successfully updated ${type} Command \"${c.name}\" in Database!`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getServCmd(server, cmd) {
    return new Promise((resolve, reject) => {
      if (!cmd) {
        const sql = "SELECT * FROM server_commands WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length===0) {
              reject("Error 404: No Server Commands found");
            } else if (results.length>=1) {
              const cms = [];
              for (const cm of results) {
                this.getCommand({id: cm.cmd_id})
                  .then(c => {
                    if (cm.enabled && !c.enabled) {
                      cms.push({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: false,
                        restricted: cm.restricted,
                        state: "Success"
                      });
                    } else {
                      cms.push({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: cm.enabled,
                        restricted: cm.restricted,
                        state: "Success"
                      });
                    }
                  })
                  .catch(err => cms.push({
                    id: cm.id,
                    cmd_id: cm.cmd_id,
                    state: "Failed",
                    reason: `${err}`
                  }));
              }
              resolve(cms);
            }
          })
          .catch(err => reject(err));
      } else {
        if (cmd.id) {
          const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, cmd.id])
            .then(results => {
              if (results.length===0) {
                reject("Error 404: Server Command not found");
              } else if (results.length===1) {
                const cm = results[0];
                this.getCommand({id: cm.cmd_id})
                  .then(c => {
                    if (!c.enabled) {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: c.enabled,
                        restricted: cm.restricted
                      });
                    } else {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: cm.enabled,
                        restricted: cm.restricted
                      });
                    }
                  })
                  .catch(err => reject(err));
              }
            })
        } else if (cmd.cmd_id) {
          this.getCommand({id: cmd.cmd_id})
            .then(c => {
              const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2";
              this.query(sql, [server.id, c.id])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Server Command not found");
                  } else if (results.length===1) {
                    const cm = results[0];
                    if (!c.enabled) {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: c.enabled,
                        restricted: cm.restricted
                      });
                    } else {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: cm.enabled,
                        restricted: cm.restricted
                      });
                    }
                  }
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        } else if (cmd.name) {
          this.getCommand({name: cmd.name}, cmd.type)
            .then(c => {
              const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2";
              this.query(sql, [server.id, c.id])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Server Command not found");
                  } else if (results.length===1) {
                    const cm = results[0];
                    if (!c.enabled) {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: c.enabled,
                        restricted: cm.restricted
                      });
                    } else {
                      resolve({
                        id: cm.id,
                        cmd_id: c.id,
                        name: c.name,
                        type: c.type,
                        enabled: cm.enabled,
                        restricted: cm.restricted
                      });
                    }
                  }
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addServCmd(server, cmd) {
    return new Promise((resolve, reject) => {
      this.getServCmd(server, cmd)
        .then(reject("Error 409: Duplicate Server Command"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            if (!cmd.cmd_id) {
              this.getCommand({name: cmd.name}, cmd.type)
                .then(c => {
                  const sql = "INSERT INTO server_commands (server_id, cmd_id, id, enabled) VALUES($1, $2, $3, $4)";
                  this.query(sql, [server.id, c.id, cmd.id, c.enabled])
                    .then(resolve(`Successfully added Command \"${c.name}\" to Server \"${server.name}\" in Database!`))
                    .catch(err1 => reject(err1));
                })
            } else {
              this.getCommand({id: cmd.cmd_id}, "slash")
                .then(c => {
                  const sql = "INSERT INTO server_commands (server_id, cmd_id, id, enabled) VALUES($1, $2, $3, $4)";
                  this.query(sql, [server.id, c.id, cmd.id, c.enabled])
                    .then(resolve(`Successfully added Command \"${c.name}\" to Server \"${server.name}\" in Database!`))
                    .catch(err1 => reject(err1));
                })
                .catch(err1 => reject(err1));
            }
          } else {
            reject(err);
          }
        });
    });
  }

  remServCmd(server, cmd) {
    return new Promise((resolve, reject) => {
      this.getServCmd(server, cmd)
        .then(cm => {
          const sql = "DELETE FROM server_commands WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, cm.id])
            .then(resolve(`Successfully removed Command ${cm.name} from Server ${server.name} in Database!`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  toggleServCmd(server, cmd, bool) {
    return new Promise((resolve, reject) => {
      this.getServCmd(server, cmd)
        .then(c => {
          const sql = "UPDATE server_commands SET enabled = $1 WHERE server_id = $2 AND id = $3";
          this.query(sql, [bool, server.id, c.id])
            .then(() => {
              if (bool) {
                resolve(`Successfully enabled Command \"${c.name}\" in Server \"${server.name}\"!`);
              } else {
                resolve(`Successfully disabled Command \"${c.name}\" in Server \"${server.name}\"!`);
              }
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  restrictServCmd(server, cmd, bool) {
    return new Promise((resolve, reject) => {
      this.getServCmd(server, cmd)
        .then(c => {
          const sql = "UPDATE server_commands SET restricted = $1 WHERE id = $2";
          this.query(sql, [bool, c.id])
            .then(() => {
              if (bool) {
                resolve(`Successfully enabled restrictions of Command \"${c.name}\" in Server \"${server.name}\"!`);
              } else {
                resolve(`Successfully disabled restrictions of Command \"${c.name}\" in Server \"${server.name}\"!`);
              }
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRestriction(cmd, rest) {
    return new Promise((resolve, reject) => {
      if (!rest) {
        const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1";
        this.query(sql, [cmd.id])
          .then(results => {
            if (results.length===0) {
              reject("Error 404: No Restrictions found");
            } else if (results.length>=1) {
              const rests = [];
              for (const res of results) {
                rests.push({
                  type: res.type,
                  id: res.id,
                  permission: res.permission
                });
              }
              resolve(rests);
            }
          })
          .catch(err => reject(err));
      } else if (rest) {
        if (rest.id) {
          const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2";
          this.query(sql, [cmd.id, rest.id])
            .then(results => {
              if (results.length===0) {
                reject("Error 404: Restriction not found");
              } else if (results.length===1) {
                resolve([{
                  type: results[0].type,
                  id: results[0].id,
                  permission: results[0].permission
                }]);
              }
            })
            .catch(err => reject(err));
        } else if (rest.type) {
          const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2";
          this.query(sql, [cmd.id, rest.type])
            .then(results => {
              if (results.length===0) {
                reject("Error 404: No Restrictions found");
              } else if (results.length>=1) {
                const rests = [];
                for (const res of results) {
                  rests.push([{
                    type: res.type,
                    id: res.id,
                    permission: res.permission
                  }]);
                }
                resolve(rests);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addRestriction(cmd, rest) {
    return new Promise((resolve, reject) => {
      this.getRestriction(cmd, rest)
        .then(res => {
          if (res[0].permission == rest.permission) {
            reject("Error 409: Duplicate Restriction");
          } else {
            const sql = "UPDATE server_command_restrictions SET permission = $1 WHERE cmd_id = $2 AND id = $3";
            this.query(sql, [rest.permission, cmd.id, rest.id])
              .then(resolve(`Successfully updated restrictions of Command \"${cmd.name}\" in Server \"${server.name}\"!`))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO server_command_restrictions VALUES($1, $2, $3, $4)";
            this.query(sql, [cmd.id, rest.type, rest.id, rest.permission])
              .then(resolve(`Successfully added restriction to Command \"${cmd.name}\" in Server \"${server.name}\"!`))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRestriction(cmd, rest) {
    return new Promise((resolve, reject) => {
      this.getRestriction(cmd, rest)
        .then(res => {
          res = res[0];
          const sql = "DELETE FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2 AND id = $3";
          this.query(sql, [cmd.id, res.type, res.id])
            .then(resolve(`Successfully removed restriction of Command \"${cmd.name}\" in Server \"${server.name}\"!`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getMember(server, user) {
    return new Promise((resolve, reject) => {
      if (!user) {
        const sql = "SELECT * FROM server_members WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Server Members found");
            } else if (results.length >= 1) {
              const users = [];
              for (const member of results) {
                this.getUser({ id: member.user_id })
                  .then(us => users.push({
                    id: us.id,
                    name: us.name,
                    state: "Success"
                  }))
                  .catch(err => users.push({
                    id: member.user_id,
                    state: "Failed",
                    reason: `${err}`
                  }));
              }
              resolve(users);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = "SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2";
        this.query(sql, [server.id, user.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: Server Member not found");
            } else if (results.length === 0) {
              const member = results[0];
              this.getUser({ id: member.user_id })
                .then(us => resolve(us))
                .catch(err => reject(err));
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  addMember(server, user) {
    return new Promise((resolve, reject) => {
      this.getMember(server, user)
        .then(reject("Error 409: Duplicate Server Member"))
        .catch(() => {
          this.getUser(user)
            .then(() => {
              const sql = "INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)";
              this.query(sql, [server.id, user.id])
                .then(resolve(`Successfully added User \"${user.username}\" to Server \"${server.name}\"`))
                .catch(err1 => reject(err1));
            })
            .catch(err1 => {
              if (String(err1).includes("Error 404: User")) {
                this.addUser(user)
                  .then(() => {
                    const sql = "INSERT INTO server_members (server_id, user_id) VALUES($1, $2)";
                    this.query(sql, [server.id, user.id])
                      .then(() => {
                        const sql = "INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)";
                        this.query(sql, [server.id, user.id])
                          .then(resolve(`Successfully added User \"${user.username}\" to Server \"${server.name}\"`))
                          .catch(err2 => reject(err2));
                      })
                      .catch(err2 => reject(err2));
                  })
                  .catch(err2 => reject(err2));
              } else {
                reject(err);
              }
            });
        });
    });
  }

  remMember(server, member) {
    return new Promise((resolve, reject) => {
      this.getMember(server, member)
        .then(us => {
          const sql = "DELETE FROM server_members WHERE server_id = $1 AND user_id = $2";
          this.query(sql, [server.id, us.id])
            .then(resolve(`Successfully removed User \"${member.username}\" from Server \"${server.name}\"`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getUser(user) {
    return new Promise((resolve, reject) => {
      if (user.id) {
        const sql = "SELECT * FROM users WHERE id = $1";
        this.query(sql, [user.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: User not found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = "SELECT * FROM users WHERE name = $1";
        this.query(sql, [user.username])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: User not found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  addUser(user) {
    return new Promise((resolve, reject) => {
      this.getUser(user)
        .then(reject("Error 409: Duplicate User"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO users (id, name) VALUES($1, $2)";
            this.query(sql, [user.id, user.username])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remUser(user) {
    return new Promise((resolve, reject) => {
      this.getUser(user)
        .then(us => {
          const sql = "DELETE FROM users WHERE id = $1";
          this.query(sql, [us.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateUser(user, char) {
    return new Promise((resolve, reject) => {
      this.getUser(user)
        .then(us => {
          if (!char) {
            const sql = "UPDATE users SET name = $1, char_id = $2 WHERE id = $3";
            this.query(sql, [user.username, char.id, us.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          } else {
            const sql = "UPDATE users SET name = $1 WHERE id = $2";
            this.query(sql, [user.username, us.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => reject(err));
    });
  }

  getServerNote(server, user, note) {
    return new Promise((resolve, reject) => {
      this.getUser(server, user)
        .then(u => {
          if (!note) {
            const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2";
            this.query(sql, [server.id, u.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Server Notes found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (note.id) {
              const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3";
              this.query(sql, [server.id, u.id, note.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Server Note not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3";
              this.query(sql, [server.id, u.id, note.title])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Server Note not found");
                  } else if (results.length >= 1) {
                    resolve(results);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addServerNote(server, user, note) {
    return new Promise((resolve, reject) => {
      this.getUser(server, user)
        .then(u => {
          this.getServerNote(server, u, note)
            .then(n => {
              if (n.content == note.content) {
                reject("Error 409: Duplicate Server Note");
              } else {
                const sql = "INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)";
                this.query(sql, [server.id, u.id, n.title, note.content, note.private])
                  .then(resolve("Success"))
                  .catch(err => reject(err));
              }
            })
            .catch(err => {
              if (String(err).includes("Error 404")) {
                const sql = "INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)";
                this.query(sql, [server.id, u.id, note.title, note.content, note.private])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              } else {
                reject(err);
              }
            });
        })
        .catch(err => reject(err));
    });
  }

  remServerNote(server, user, note) {
    return new Promise((resolve, reject) => {
      this.getUser(server, user)
        .then(u => {
          this.getServerNote(server, u, note)
            .then(n => {
              const sql = "DELETE FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3";
              this.query(sql, [server.id, u.id, n.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateServerNote(server, user, note) {
    return new Promise((resolve, reject) => {
      this.getUser(server, user)
        .then(u => {
          this.getServerNote(server, u, note)
            .then(n => {
              const sql = "UPDATE server_notes SET title = $1, content = $2, private = $3 WHERE server_id = $4 AND user_id = $5 AND id = $6";
              this.query(sql, [note.title, note.content, note.private, server.id, u.id, n.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getGlobalNote(user, note) {
    return new Promise((resolve, reject) => {
      if (!note) {
        const sql = "SELECT * FROM global_notes WHERE user_id = $1";
        this.query(sql, [user.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Global Notes found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (note.id) {
          const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND id = $2";
          this.query(sql, [user.id, note.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Global Note not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND title = $2";
          this.query(sql, [user.id, note.title])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Global Note not found");
              } else if (results.length >= 1) {
                resolve(results);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addGlobalNote(user, note) {
    return new Promise((resolve, reject) => {
      this.getGlobalNote(user, note)
        .then(n => {
          if (n.content == note.content) {
            reject("Error 409: Duplicate Global Note");
          } else {
            const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
            this.query(sql, [user.id, note.title, note.content, note.private])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
            this.query(sql, [user.id, note.title, note.content, note.private])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remGlobalNote(user, note) {
    return new Promise((resolve, reject) => {
      this.getGlobalNote(user, note)
        .then(n => {
          const sql = "DELETE FROM global_notes WHERE user_id = $1 AND id = $2";
          this.query(sql, [user.id, n.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateGlobalNote(user, note) {
    return new Promise((resolve, reject) => {
      this.getGlobalNote(user, note)
        .then(n => {
          const sql = "UPDATE global_notes SET title = $1, content = $2, private = $3 WHERE user_id = $4 AND id = $5";
          this.query(sql, [note.title, note.content, note.private, user.id, n.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getArmor(server, armor) {
    return new Promise((resolve, reject) => {
      if (!armor) {
        const sql = "SELECT * FROM armors WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Armor found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (armor.id) {
          const sql = "SELECT * FROM armors WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, armor.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Armor not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM armors WHERE server_id = $1 AND name = $2";
          this.query(sql, [server.id, armor.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Armor not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(reject("Error 409: Duplicate Armor"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO armors (server_id, name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
            this.query(sql, [server.id, armor.name, armor.description, armor.type, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(arm => {
          const sql = "DELETE FROM armors WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, arm.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(arm => {
          const sql = "UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE server_id = $12 AND id = $13";
          this.query(sql, [armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req, server.id, arm.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getChar(user, char) {
    return new Promise((resolve, reject) => {
      if (!char) {
        const sql = "SELECT * FROM characters WHERE user_id = $1";
        this.query(sql, [user.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Characters found");
            } else if (results.length >= 1) {
              let chars = []
              for (let i = 0; i < results.length; i++) {
                let char = {
                  owner: user.id,
                  name: results[0].name,
                  ac: results[0].ac,
                  init: results[0].init,
                  level: results[0].level,
                  xp: results[0].xp,
                  stat: {
                    str: 0,
                    dex: 0,
                    con: 0,
                    int: 0,
                    wis: 0,
                    cha: 0,
                  },
                  money: {
                    pp: results[0].pp,
                    gp: results[0].gp,
                    ep: results[0].ep,
                    sp: results[0].sp,
                    cp: results[0].cp
                  },
                  multi: results[0].multi,
                  armor: null,
                  race: null,
                  subrace: null,
                  clas: null,
                  subclass: null,
                  class_level: results[0].class_level,
                  mc1: null,
                  mc1sub: null,
                  mc1_level: results[0].mc1_level,
                  mc2: null,
                  mc2sub: null,
                  mc2_level: results[0].mc2_level,
                  mc3: null,
                  mc3sub: null,
                  mc3_level: results[0].mc3_level
                }
                this.getCharStat()
                this.getArmor(server, { id: results[0].armor_id })
                  .then(arm => char.armor = arm.name)
                  .catch(console.error);
                this.getRace(server, { id: results[0].race_id })
                  .then(race => {
                    char.race = race.name;
                    if (race.sub) {
                      this.getSubrace(server, race, { id: results[0].subrace_id })
                        .then(sub => char.subrace = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                this.getClass(server, { id: results[0].class_id })
                  .then(clas => {
                    char.clas = clas.name;
                    if (clas.sub) {
                      this.getSubclass(server, clas, { id: results[0].subclass_id })
                        .then(sub => char.subclass = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                if (char.multi) {
                  if (results[0].multiclass1_id) {
                    this.getClass(server, { id: results[0].multiclass1_id })
                      .then(clas => {
                        char.mc1 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass1_sub_id })
                            .then(sub => char.mc1sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass2_id) {
                    this.getClass(server, { id: results[0].multiclass2_id })
                      .then(clas => {
                        char.mc2 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass2_sub_id })
                            .then(sub => char.mc2sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass3_id) {
                    this.getClass(server, { id: results[0].multiclass3_id })
                      .then(clas => {
                        char.mc3 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass3_sub_id })
                            .then(sub => char.mc3sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                }
                chars.push(char);
              }
              resolve(chars);
            }
          })
          .catch(err => reject(err));
      } else {
        if (char.id) {
          const sql = "SELECT * FROM characters WHERE user_id = $1 AND id = $2";
          this.query(sql, [user.id, char.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character not found");
              } else if (results.length === 1) {
                let char = {
                  owner: user.id,
                  name: results[0].name,
                  ac: results[0].ac,
                  init: results[0].init,
                  level: results[0].level,
                  xp: results[0].xp,
                  stat: {
                    str: 0,
                    dex: 0,
                    con: 0,
                    int: 0,
                    wis: 0,
                    cha: 0,
                  },
                  money: {
                    pp: results[0].pp,
                    gp: results[0].gp,
                    ep: results[0].ep,
                    sp: results[0].sp,
                    cp: results[0].cp
                  },
                  multi: results[0].multi,
                  armor: null,
                  race: null,
                  subrace: null,
                  clas: null,
                  subclass: null,
                  class_level: results[0].class_level,
                  mc1: null,
                  mc1sub: null,
                  mc1_level: results[0].mc1_level,
                  mc2: null,
                  mc2sub: null,
                  mc2_level: results[0].mc2_level,
                  mc3: null,
                  mc3sub: null,
                  mc3_level: results[0].mc3_level
                }
                this.getArmor(server, { id: results[0].armor_id })
                  .then(arm => char.armor = arm.name)
                  .catch(console.error);
                this.getRace(server, { id: results[0].race_id })
                  .then(race => {
                    char.race = race.name;
                    if (race.sub) {
                      this.getSubrace(server, race, { id: results[0].subrace_id })
                        .then(sub => char.subrace = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                this.getClass(server, { id: results[0].class_id })
                  .then(clas => {
                    char.clas = clas.name;
                    if (clas.sub) {
                      this.getSubclass(server, clas, { id: results[0].subclass_id })
                        .then(sub => char.subclass = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                if (char.multi) {
                  if (results[0].multiclass1_id) {
                    this.getClass(server, { id: results[0].multiclass1_id })
                      .then(clas => {
                        char.mc1 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass1_sub_id })
                            .then(sub => char.mc1sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass2_id) {
                    this.getClass(server, { id: results[0].multiclass2_id })
                      .then(clas => {
                        char.mc2 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass2_sub_id })
                            .then(sub => char.mc2sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass3_id) {
                    this.getClass(server, { id: results[0].multiclass3_id })
                      .then(clas => {
                        char.mc3 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass3_sub_id })
                            .then(sub => char.mc3sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                }
                resolve(char);
              }
            })
        } else {
          const sql = "SELECT * FROM characters WHERE user_id = $1 AND name = $2";
          this.query(sql, [user.id, char.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character not found");
              } else if (results.length === 1) {
                let char = {
                  id: results[0].id,
                  owner: user.id,
                  name: results[0].name,
                  ac: results[0].ac,
                  init: results[0].init,
                  level: results[0].level,
                  xp: results[0].xp,
                  stats: {
                    str: 0,
                    dex: 0,
                    con: 0,
                    int: 0,
                    wis: 0,
                    cha: 0,
                  },
                  money: {
                    pp: results[0].pp,
                    gp: results[0].gp,
                    ep: results[0].ep,
                    sp: results[0].sp,
                    cp: results[0].cp
                  },
                  multi: results[0].multi,
                  armor: null,
                  race: null,
                  subrace: null,
                  clas: null,
                  subclass: null,
                  class_level: results[0].class_level,
                  mc1: null,
                  mc1sub: null,
                  mc1_level: results[0].mc1_level,
                  mc2: null,
                  mc2sub: null,
                  mc2_level: results[0].mc2_level,
                  mc3: null,
                  mc3sub: null,
                  mc3_level: results[0].mc3_level
                }
                this.getCharStat({id: results[0].id})
                  .then(stats => char.stats = stats[0])
                this.getArmor(server, { id: results[0].armor_id })
                  .then(arm => char.armor = arm.name)
                  .catch(console.error);
                this.getRace(server, { id: results[0].race_id })
                  .then(race => {
                    char.race = race.name;
                    if (race.sub) {
                      this.getSubrace(server, race, { id: results[0].subrace_id })
                        .then(sub => char.subrace = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                this.getClass(server, { id: results[0].class_id })
                  .then(clas => {
                    char.clas = clas.name;
                    if (clas.sub) {
                      this.getSubclass(server, clas, { id: results[0].subclass_id })
                        .then(sub => char.subclass = sub.name)
                        .catch(console.error);
                    }
                  })
                  .catch(console.error);
                if (char.multi) {
                  if (results[0].multiclass1_id) {
                    this.getClass(server, { id: results[0].multiclass1_id })
                      .then(clas => {
                        char.mc1 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass1_sub_id })
                            .then(sub => char.mc1sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass2_id) {
                    this.getClass(server, { id: results[0].multiclass2_id })
                      .then(clas => {
                        char.mc2 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass2_sub_id })
                            .then(sub => char.mc2sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                  if (results[0].multiclass3_id) {
                    this.getClass(server, { id: results[0].multiclass3_id })
                      .then(clas => {
                        char.mc3 = clas.name;
                        if (clas.sub) {
                          this.getSubclass(server, clas, { id: results[0].multiclass3_sub_id })
                            .then(sub => char.mc3sub = sub.name)
                            .catch(console.error);
                        }
                      })
                      .catch(console.error);
                  }
                }
                resolve(char);
              } else if (results.length > 1) {
                resolve(results);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addChar(server, user, char) {
    return new Promise((resolve, reject) => {
      reject("Character Creation is currently in Development!");
    });
  }

  remChar(user, char) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(results => {
          if (isArray(results)) {
            reject("Error 409: Found more than 1 Character!")
          } else {
            let char = results;
            const sql = "DELETE FROM characters WHERE user_id = $1 AND id = $2";
            this.query(sql, [user.id, char.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => reject(err));
    });
  }

  updateCharXP(user, char, method, xp) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          switch (method) {
            case "set":
              const sql = "UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3";
              this.query(sql, [xp, c.user_id, c.id])
                .then(() => {
                  const sql1 = "UPDATE characters SET pb = $1, level = $2 WHERE user_id = $3 AND id = $4";
                  if (xp<300) {
                    this.query(sql1, [2,1,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err))
                  } else if (xp<900) {
                    this.query(sql1, [2,2,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<2700) {
                    this.query(sql1, [2,3,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<6500) {
                    this.query(sql1, [2,4,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<14000) {
                    this.query(sql1, [3,5,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<23000) {
                    this.query(sql1, [3,6,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<34000) {
                    this.query(sql1, [3,7,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<48000) {
                    this.query(sql1, [3,8,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<64000) {
                    this.query(sql1, [4,9,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<85000) {
                    this.query(sql1, [4,10,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<100000) {
                    this.query(sql1, [4,11,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<120000) {
                    this.query(sql1, [4,12,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<140000) {
                    this.query(sql1, [5,13,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<165000) {
                    this.query(sql1, [5,14,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<195000) {
                    this.query(sql1, [5,15,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<225000) {
                    this.query(sql1, [5,16,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<265000) {
                    this.query(sql1, [6,17,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<305000) {
                    this.query(sql1, [6,18,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<335000) {
                    this.query(sql1, [6,19,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp==335000) {
                    this.query(sql1, [6,20,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  }
                })
                .catch(err => reject(err));
            break;
            case "add":
              xp+=c.xp;
              const sql1 = "UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3";
              this.query(sql1, [xp, c.user_id, c.id])
                .then(() => {
                  const sql2 = "UPDATE characters SET pb = $1, level = $2 WHERE user_id = $3 AND id = $4";
                  if (xp<300) {
                    this.query(sql2, [2,1,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err))
                  } else if (xp<900) {
                    this.query(sql2, [2,2,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<2700) {
                    this.query(sql2, [2,3,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<6500) {
                    this.query(sql2, [2,4,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<14000) {
                    this.query(sql2, [3,5,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<23000) {
                    this.query(sql2, [3,6,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<34000) {
                    this.query(sql2, [3,7,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<48000) {
                    this.query(sql2, [3,8,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<64000) {
                    this.query(sql2, [4,9,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<85000) {
                    this.query(sql2, [4,10,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<100000) {
                    this.query(sql2, [4,11,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<120000) {
                    this.query(sql2, [4,12,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<140000) {
                    this.query(sql2, [5,13,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<165000) {
                    this.query(sql2, [5,14,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<195000) {
                    this.query(sql2, [5,15,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<225000) {
                    this.query(sql2, [5,16,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<265000) {
                    this.query(sql2, [6,17,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<305000) {
                    this.query(sql2, [6,18,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<335000) {
                    this.query(sql2, [6,19,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp==335000) {
                    this.query(sql2, [6,20,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  }
                })
                .catch(err => reject(err));
            break;
            case "rem":
              xp = c.xp - xp;
              const sql3 = "UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3";
              this.query(sql3, [xp, c.user_id, c.id])
                .then(() => {
                  const sql2 = "UPDATE characters SET pb = $1, level = $2 WHERE user_id = $3 AND id = $4";
                  if (xp<300) {
                    this.query(sql2, [2,1,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err))
                  } else if (xp<900) {
                    this.query(sql2, [2,2,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<2700) {
                    this.query(sql2, [2,3,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<6500) {
                    this.query(sql2, [2,4,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<14000) {
                    this.query(sql2, [3,5,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<23000) {
                    this.query(sql2, [3,6,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<34000) {
                    this.query(sql2, [3,7,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<48000) {
                    this.query(sql2, [3,8,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<64000) {
                    this.query(sql2, [4,9,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<85000) {
                    this.query(sql2, [4,10,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<100000) {
                    this.query(sql2, [4,11,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<120000) {
                    this.query(sql2, [4,12,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<140000) {
                    this.query(sql2, [5,13,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<165000) {
                    this.query(sql2, [5,14,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<195000) {
                    this.query(sql2, [5,15,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<225000) {
                    this.query(sql2, [5,16,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<265000) {
                    this.query(sql2, [6,17,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<305000) {
                    this.query(sql2, [6,18,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp<335000) {
                    this.query(sql2, [6,19,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else if (xp==335000) {
                    this.query(sql2, [6,20,c.user_id, c.id])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  }
                })
                .catch(err => reject(err));
            break;
          }
        })
        .catch(err => reject(err));
    });
  }

  setCharLvl(server, user, char, lvl) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          const xp = 300 * (lvl - 1);
          this.updateCharXP(user, char, "set", xp)
            .then(() => {
              this.updateCharHP(server, user, char)
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  selectChar(user, char) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          const sql = "UPDATE users SET char_id = $1 WHERE user_id = $2";
          this.query(sql, [user.id, c.id])
            .then(resolve(`Changed active Character to \"${c.name}\"`))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateCharHP(server, user, char) {
    return new Promise((resolve, reject) => {
      this.getServer(server)
        .then(s => {
          this.getChar(user, char)
            .then(c => {
              this.getClass(server, {id: c.class_id})
                .then(clas => {
                  let hp;
                  if (s.hp_method == "fixed") {
                    if (c.level>1) {
                      hp = clas.hitdice_size + c.class_level
                    } else {
                      hp = clas.hitdice_size;
                    }
                  }
                })
            })
        })
    });
  }

  getCharNote(user, char, note) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          if (!note) {
            const sql = "SELECT * FROM character_notes WHERE char_id = $1";
            this.query(sql, [c.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Charcter Notes found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (note.id) {
              const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND id = $2";
              this.query(sql, [c.id, note.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Character Note not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND title = $2";
              this.query(sql, [c.id, note.title])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Character Note not found");
                  } else if (results.length >= 1) {
                    resolve(results);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addCharNote(user, char, note) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          this.getCharNote(user, c, note)
            .then(n => {
              if (n.content == note.content) {
                reject("Error 409: Duplicate Character Note");
              } else {
                const sql = "INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)";
                this.query(sql, [c.id, note.title, note.content, note.private])
                  .then(resolve("Success"))
                  .catch(err => reject(err));
              }
            })
            .catch(err => {
              if (String(err).includes("Error 404")) {
                const sql = "INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)";
                this.query(sql, [c.id, note.title, note.content, note.private])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              } else {
                reject(err);
              }
            });
        })
        .catch(err => reject(err));
    });
  }

  remCharNote(user, char, note) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          this.getCharNote(user, c, note)
            .then(n => {
              const sql = "DELETE FROM character_notes WHERE char_id = $1 AND id = $2";
              this.query(sql, [c.id, n.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateCharNote(user, char, note) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          this.getCharNote(user, char, note)
            .then(n => {
              const sql = "UPDATE character_notes SET title = $1, content = $2, private = $3 WHERE char_id = $4 AND id = $5";
              this.query(sql, [note.title, note.content, note.private, c.id, n.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharStat(char, stat) {
    return new Promise((resolve, reject) => {
      if (!stat) {
        const sql = "SELECT * FROM character_stats WHERE char_id = $1";
        this.query(sql, [char.id])
          .then(results => {
            if (results.length===0) {
              reject("Error 404: No Character Stats found");
            } else if (results.length===1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      } else {
        const sql = `SELECT ${stat} FROM character_stats WHERE char_id = $1`;
        this.query(sql, [char.id])
          .then(results => {
            if (results.length===0) {
              reject("Error 404: Character Stat not found");
            } else if (results.length===1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  setCharStat(char, stat, val) {
    return new Promise((resolve, reject) => {
      this.getCharStat(char, stat)
        .then(s => {
          if (s.includes(val)) {
            reject("Error 409: Duplicate Character Stat");
          } else {
            const sql = `UPDATE character_stats SET ${stat} = $1 WHERE char_id = $2`;
            this.query(sql, [val, char.id])
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404: No")) {
            const sql = "INSERT INTO character_stats (char_id, str, dex, con, int, wis, cha) VALUES($1, $2, $3, $4, $5, $6, $7)";
            this.query(sql, [char.id, val[0], val[1], val[2], val[3], val[4], val[5]])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCharStat(char, stat) {
    return new Promise((resolve, reject) => {
      this.getCharStat(char, stat)
        .then(function() {
          const sql = "DELETE FROM character_stats WHERE char_id = $1 AND name = $2";
          this.query(sql, [char.id, stat.name])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharAction(server, user, char, act) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          if (!act) {
            const sql = "SELECT * FROM character_actions WHERE char_id = $1";
            this.query(sql, [c.id])
              .then(results => {
                if (results.length===0) {
                  reject("Error 404: No Actions found");
                } else if (results.length>=1) {
                  const acts = [];
                  for (const action of results) {
                    if (action.atk_id) {
                      this.getCharAttack(c, {id: action.atk_id})
                        .then(atk => {
                          this.getCondOrDmgtype(server, "damagetypes", {id: atk.dmg_type_id})
                            .then(type => acts.push({
                              id: action.id,
                              akt_id: atk.id,
                              name: atk.name,
                              description: atk.description,
                              atk_stat: atk.atk_stat,
                              save: atk.save,
                              save_stat: atk.save_stat,
                              on_fail: atk.on_fail,
                              dmg_dice: akt.dmg_dice,
                              dmg_dice_size: atk.dmg_dice_size,
                              dmg: atk.dmg,
                              dmg_type: type.name,
                              magical: atk.magical,
                              magic_bonus: atk.magic_bonus,
                              state: "Success"
                            }))
                            .catch(err => acts.push({
                              name: action.name,
                              id: action.id,
                              state: "Failed",
                              reason: `${err}`
                            }));
                        })
                        .catch(err => acts.push({
                          name: action.name,
                          id: action.id,
                          state: "Failed",
                          reason: `${err}`
                        }));
                    }
                  }
                  resolve(acts);
                }
              })
              .catch(err => reject(err));
          } else {
            if (act.id) {
              const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND id = $2";
              this.query(sql, [c.id, act.id])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Action not found");
                  } else if (results.length===1) {
                    act = results[0];
                    if (act.atk_id) {
                      this.getCharAttack(c, {id: action.atk_id})
                        .then(atk => {
                          this.getCondOrDmgtype(server, "damagetypes", {id: atk.dmg_type_id})
                            .then(type => resolve({
                              id: act.id,
                              akt_id: atk.id,
                              name: atk.name,
                              description: atk.description,
                              atk_stat: atk.atk_stat,
                              save: atk.save,
                              save_stat: atk.save_stat,
                              on_fail: atk.on_fail,
                              dmg_dice: akt.dmg_dice,
                              dmg_dice_size: atk.dmg_dice_size,
                              dmg: atk.dmg,
                              dmg_type: type.name,
                              magical: atk.magical,
                              magic_bonus: atk.magic_bonus,
                              state: "Success"
                            }))
                            .catch(err => reject(err));
                        })
                        .catch(err => reject(err));
                    }
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND name = $2";
              this.query(sql, [c.id, act.name])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Action not found");
                  } else if (results.length===1) {
                    act = results[0];
                    if (act.atk_id) {
                      this.getCharAttack(c, {id: act.atk_id})
                        .then(atk => {
                          this.getCondOrDmgtype(server, "damagetypes", {id: atk.dmg_type_id})
                            .then(type => resolve({
                              id: act.id,
                              akt_id: atk.id,
                              name: atk.name,
                              description: atk.description,
                              atk_stat: atk.atk_stat,
                              save: atk.save,
                              save_stat: atk.save_stat,
                              on_fail: atk.on_fail,
                              dmg_dice: akt.dmg_dice,
                              dmg_dice_size: atk.dmg_dice_size,
                              dmg: atk.dmg,
                              dmg_type: type.name,
                              magical: atk.magical,
                              magic_bonus: atk.magic_bonus,
                              state: "Success"
                            }))
                            .catch(err => reject(err));
                        })
                        .catch(err => reject(err));
                    } else if (results.length>1) {
                      const acts = [];
                      for (const action of results) {
                        if (action.atk_id) {
                          this.getCharAttack(c, {id: action.atk_id})
                            .then(atk => {
                              this.getCondOrDmgtype(server, "damagetypes", {id: atk.dmg_type_id})
                                .then(type => acts.push({
                                  id: action.id,
                                  akt_id: atk.id,
                                  name: atk.name,
                                  description: atk.description,
                                  atk_stat: atk.atk_stat,
                                  save: atk.save,
                                  save_stat: atk.save_stat,
                                  on_fail: atk.on_fail,
                                  dmg_dice: akt.dmg_dice,
                                  dmg_dice_size: atk.dmg_dice_size,
                                  dmg: atk.dmg,
                                  dmg_type: type.name,
                                  magical: atk.magical,
                                  magic_bonus: atk.magic_bonus,
                                  state: "Success"
                                }))
                                .catch(err => acts.push({
                                  id: action.id,
                                  name: action.name,
                                  state: "Failed",
                                  reason: `${err}`
                                }));
                            })
                            .catch(err => acts.push({
                              name: action.name,
                              id: action.id,
                              state: "Failed",
                              reason: `${err}`
                            }));
                        }
                      }
                      resolve(acts);
                    }
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addCharAction(server, user, char, act) {
    return new Promise((resolve, reject) => {
      this.getCharAction(server, user, char, act)
        .then(reject("Error 409: Duplicate Action"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO character_actions (char_id, name, description, type, atk_id) VALUES($1, $2; $3, $4, $5)";
            this.query(sql, [char.id, act.name, act.description, act.type, act.atk_id])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCharAction(server, user, char, act) {
    return new Promise((resolve, reject) => {
      this.getCharAction(server, user, char, act)
        .then(a => {
          const sql = "DELETE FROM character_actions WHERE char_id = $1 AND id = $2";
          this.query(sql, [a.char_id, a.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateCharAction(server, user, char, act) {
    return new Promise((resolve, reject) => {
      this.getCharAction(server, user, char, act)
        .then(a => {
          const sql = "UPDATE character_actions SET name = $1, description = $2, type = $3 WHERE char_id = $4 AND id = $5";
          this.query(sql, [act.name, act.description, act.type, a.char_id, a.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharAttack(user, char, atk) {
    return new Promise((resolve, reject) => {
      this.getChar(user, char)
        .then(c => {
          if (!atk) {
            const sql = "SELECT * FROM character_attacks WHERE char_id = $1";
            this.query(sql, [c.id])
              .then(results => {
                if (results.length===0) {
                  reject("Error 404: No Attacks found");
                } else if (results.length>=1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (atk.id) {
              const sql = "SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2";
              this.query(sql, [c.id, atk.id])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Attack not found");
                  } else if (results.length===1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2";
              this.query(sql, [c.id, atk.name])
                .then(results => {
                  if (results.length===0) {
                    reject("Error 404: Attack not found");
                  } else if (results.length===1) {
                    resolve(results[0]);
                  } else if (results.length>1) {
                    resolve(results);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addCharAttack(user, char, atk) {
    return new Promise((resolve, reject) => {
      this.getCharAttack(user, char, atk)
        .then(reject("Error 409: Duplicate Attack"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO character_attacks (char_id, name, description, atk_stat, save, save_stat, on_fail, dmg_dice, dmg_dice_size, dmg, dmg_type_id, magical, magic_bonus) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
            this.query(sql, [char.id, atk.name, atk.description, atk.atk_stat, atk.save, atk.on_fail, atk.dmg_dice, atk.dmg_dice_size, atk.dmg, atk.dmg_type_id, atk.magical, atk.magic_bonus])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCharAttack(user, char, atk) {
    return new Promise((resolve, reject) => {
      this.getCharAttack(user, char, atk)
        .then(a => {
          const sql = "DELETE FROM character_attacks WHERE char_id = $1 AND id = $2";
          this.query(sql, [a.char_id, a.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }



  getCharFeat(server, char, feat) {
    return new Promise((resolve, reject) => {
      if (!feat) {
        const sql = "SELECT * FROM character_feats WHERE char_id = $1";
        this.query(sql, [char.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Character Feats found");
            } else if (results.length >= 1) {
              let list = [];
              for (const f of results) {
                this.getFeat(server, { id: f.feat_id })
                  .then(feats => {
                    if (feats.length === 1) {
                      list.push({
                        name: feats[0].name,
                        description: feats[0].description,
                        feat_id: feats[0].id,
                        id: f.id,
                        state: "Valid"
                      });
                    } else {
                      list.push({
                        name: feats[0].name,
                        state: "Invalid"
                      });
                    }
                  })
                  .catch(list.push({
                    name: f[0].name,
                    state: "Invalid"
                  }));
              }
              resolve(list);
            }
          })
          .catch(err => reject(err));
      } else {
        if (feat.id) {
          const sql = "SELECT * FROM character_feats WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, feat.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character Feat not found");
              } else if (results.length === 1) {
                this.getFeat(server, { id: results[0].feat_id })
                  .then(feats => {
                    if (feats.length === 1) {
                      resolve({
                        name: feats[0].name,
                        description: feats[0].description,
                        feat_id: feats[0].id,
                        id: feat.id,
                        state: "Valid"
                      });
                    } else if (feats.length === 0) {
                      reject("Error 400: Invalid Feat");
                    }
                  })
                  .catch(reject("Error 400: Invalid Feat"));
              }
            })
            .catch(err => reject(err));
        } else {
          this.getFeat(server, { name: feat.name })
            .then(f => resolve(f))
            .catch(reject("Error 400: Invalid Feat"));
        }
      }
    });
  }

  addCharFeat(server, char, feat) {
    return new Promise((resolve, reject) => {
      this.getCharFeat(server, char, feat)
        .then(reject("Error 409: Duplicate Character Feat"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getFeat(server, feat)
              .then(f => {
                const sql = "INSERT INTO character_feats (char_id, feat_id) VALUES ($1, $2)";
                this.query(sql, [char.id, f.id])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              })
              .catch(reject("Error 400: Invalid Feat"));
          } else {
            reject(err);
          }
        });
    });
  }

  remCharFeat(server, char, feat) {
    return new Promise((resolve, reject) => {
      this.getCharFeat(server, char, feat)
        .then(f => {
          const sql = "DELETE FROM character_feats WHERE char_id = $1 AND feat_id = $2 AND id = $3";
          this.query(sql, [char.id, f.feat_id, f.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharProf(char, prof) {
    //TODO: Copy over from GitHub
  }

  addCharProf(char, prof) {
    //TODO: Copy over from GitHub
  }

  remCharProf(char, prof) {
    //TODO: Copy over from GitHub
  }

  getCondOrDmgtype(server, type, conordmg) {
    return new Promise((resolve, reject) => {
      if (!conordmg) {
        const sql = `SELECT * FROM ${type} WHERE server_id = $1`;
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject(`Error 404: No such ${type} found`);
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (conordmg.id) {
          const sql = `SELECT * FROM ${type} WHERE server_id = $1 AND id = $2`;
          this.query(sql, [server.id, conordmg.id])
            .then(results => {
              if (results.length === 0) {
                reject(`Error 404: ${type} not found`);
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = `SELECT * FROM ${type} WHERE server_id = $1 AND name = $2`;
          this.query(sql, [server.id, conordmg.name])
            .then(results => {
              if (results.length === 0) {
                reject(`Error 404: ${type} not found`);
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addCondOrDmgtype(server, type, conordmg) {
    return new Promise((resolve, reject) => {
      this.getCondOrDmgtype(server, type, conordmg)
        .then(reject(`Error 409: Duplicate ${type}`))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = `INSERT INTO ${type} (server_id, name) VALUES($1, $2)`;
            this.query(sql, [server.id, conordmg.name])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCondOrDmgtype(server, type, conordmg) {
    return new Promise((resolve, reject) => {
      this.getCondOrDmgtype(server, type, conordmg)
        .then(cod => {
          const sql = `DELETE FROM ${type} WHERE server_id = $1 AND id = $2`;
          this.query(sql, [server.id, cod.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateCondOrDmgtype(server, type, conordmg) {
    return new Promise((resolve, reject) => {
      this.getCondOrDmgtype(server, type, conordmg)
        .then(cod => {
          const sql = `UPDATE ${type} SET name = $1 WHERE server_id = $2 AND id = $3`;
          this.query(sql, [conordmg.name, server.id, cod.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharRes(server, char, res) {
    return new Promise((resolve, reject) => {
      if (!res) {
        const sql = "SELECT * FROM character_resistances WHERE char_id = $1";
        this.query(sql, [char.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Character Resistances found");
            } else if (results.length >= 1) {
              const resistances = [];
              for (const resist of results) {
                this.getCondOrDmgtype(server, resist.type, resist)
                  .then(r => resistances.push({
                    name: r.name,
                    type: resist.type,
                    res_id: r.id,
                    id: resist.id,
                    state: "Valid"
                  }))
                  .catch(resistances.push({
                    type: resist.type,
                    state: "Invalid"
                  }));
              }
              resolve(resistances);
            }
          })
          .catch(err => reject(err));
      } else {
        if (res.res_id) {
          this.getCondOrDmgtype(server, res.type, { id: res.res_id })
            .then(r => {
              const sql = "SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2";
              this.query(sql, [char.id, r.id])
                .then(resist => {
                  if (resist.length === 0) {
                    reject("Error 404: Character Resistance not found");
                  } else if (resist.length === 1) {
                    resolve({
                      name: r.name,
                      type: res.type,
                      res_id: r.id,
                      id: resist[0].id,
                      state: "Valid"
                    });
                  }
                })
                .catch(err => reject(err));
            })
            .catch(reject("Error 400: Invalid Resistance"));
        } else if (res.id) {
          const sql = `SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2`;
          this.query(sql, [char.id, res.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character Resistance not found");
              } else if (results.length === 1) {
                this.getCondOrDmgtype(server, res.type, { id: results[0].res_id })
                  .then(r => resolve({
                    name: r.name,
                    type: res.type,
                    res_id: r.id,
                    id: res.id,
                    state: "Valid"
                  }))
                  .catch(reject("Error 400: Invalid Resistance"));
              }
            })
            .catch(err => reject(err));
        } else {
          this.getCondOrDmgtype(server, res.type, { name: res.name })
            .then(r => {
              const sql = "SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2";
              this.query(sql, [server.id, r.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Character Resistance not found");
                  } else if (results.length === 1) {
                    resolve({
                      name: r.name,
                      type: res.type,
                      res_id: r.id,
                      id: results[0].id,
                      state: "Valid"
                    });
                  }
                })
                .catch(err => reject(err));
            })
            .catch(reject("Error 400: Invalid Resistance"));
        }
      }
    });
  }

  addCharRes(server, char, res) {
    return new Promise((resolve, reject) => {
      this.getCharRes(server, char, res)
        .then(reject("Error 409: Duplicate Character Resistance"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getCharImm(server, char, { name: res.name, type: res.type })
              .then(reject(`Error 409: Immunity for that ${res.type} already exists!`))
              .catch(err1 => {
                if (String(err1).includes("Error 404")) {
                  this.getCondOrDmgtype(server, res.type, { name: res.name })
                    .then(r => {
                      const sql = "INSERT INTO character_resistances (char_id, type, res_id) VALUES ($1, $2, $3)";
                      this.query(sql, [char.id, res.type, r.id])
                        .then(resolve("Success"))
                        .catch(err2 => reject(err2));
                    })
                    .catch(reject("Error 400: Invalid Resistance"));
                } else {
                  reject(err1);
                }
              })
          } else {
            reject(err);
          }
        });
    });
  }

  remCharRes(server, char, res) {
    return new Promise((resolve, reject) => {
      this.getCharRes(server, char, res)
        .then(r => {
          const sql = "DELETE FROM character_resistances WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, r.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharImm(server, char, imm) {
    return new Promise((resolve, reject) => {
      if (!imm) {
        const sql = "SELECT * FROM character_immunities WHERE char_id = $1";
        this.query(sql, [char.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Character Immunities found");
            } else if (results.length >= 1) {
              const immunities = [];
              for (const immune of results) {
                this.getCondOrDmgtype(server, immune.type, { id: immune.imm_id })
                  .then(i => immunities.push({
                    name: i.name,
                    type: immune.type,
                    imm_id: i.id,
                    id: immune.id,
                    state: "Valid"
                  }))
                  .catch(immunities.push({
                    type: immune.type,
                    state: "Invalid"
                  }));
              }
              resolve(immunities);
            }
          })
          .catch(reject("Error 400: Invalid Immunity"));
      } else {
        if (imm.imm_id) {
          this.getCondOrDmgtype(server, imm.type, { id: imm.imm_id })
            .then(i => {
              if (i.length === 0) {
                reject("Error 400: Invalid Immunity");
              } else {
                const sql = "SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2";
                this.query(sql, [char.id, i.id])
                  .then(resist => {
                    if (resist.length === 0) {
                      reject("Error 404: Character Immunity not found");
                    } else if (resist.length === 1) {
                      resolve({
                        name: i.name,
                        type: res.type,
                        res_id: i.id,
                        id: resist[0].id,
                        state: "Valid"
                      });
                    }
                  })
                  .catch(err => reject(err));
              }
            })
            .catch(reject("Error 400: Invalid Immunity"));
        } else if (imm.id) {
          const sql = "SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, imm.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character Immunity not found");
              } else if (results.length === 0) {
                this.getCondOrDmgtype(server, imm.type, { id: results[0].imm_id })
                  .then(i => resolve({
                    name: i.name,
                    type: imm.type,
                    imm_id: i.id,
                    id: imm.id,
                    state: "Valid"
                  }))
                  .catch(reject("Error 400: Invalid Immunity"));
              }
            })
            .catch(err => reject(err));
        } else {
          this.getCondOrDmgtype(server, imm.type, { name: imm.name })
            .then(i => {
              const sql = "SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2";
              this.query(sql, [char.id, i.id])
                .then(immune => {
                  if (immune.length === 0) {
                    reject("Error 404: Character Immunity not found");
                  } else if (immune.length === 1) {
                    resolve({
                      name: i.name,
                      type: imm.type,
                      imm_id: i.id,
                      id: immune.id,
                      state: "Valid"
                    });
                  }
                })
                .catch(err => reject(err));
            })
            .catch(reject("Error 400: Invalid Immunity"));
        }
      }
    });
  }

  addCharImm(server, char, imm) {
    return new Promise((resolve, reject) => {
      this.getCharImm(server, char, imm)
        .then(reject("Error 409: Duplicate Character Immunity"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getCharRes(server, char, { name: imm.name, type: imm.type })
              .then(res => {
                this.remCharRes(server, char, res)
                  .then(function() {
                    const sql = "INSERT INTO character_immunities (char_id, type, imm_id) VALUES ($1, $2, $3)";
                    this.query(sql, [char.id, imm.type, res.res_id])
                      .then(resolve("Success"))
                      .catch(err1 => reject(err1));
                  })
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => {
                if (String(err1).includes("Error 404")) {
                  this.getCondOrDmgtype(server, imm.type, { name: imm.name })
                    .then(i => {
                      const sql = "INSERT INTO character_immunities (char_id, type, imm_id) VALUES ($1, $2, $3)";
                      this.query(sql, [char.id, imm.type, i.id])
                        .then(resolve("Success"))
                        .catch(err2 => reject(err2));
                    })
                    .catch(reject("Error 400: Invalid Immunity"));
                }
              });
          } else {
            reject(err);
          }
        });
    });
  }

  remCharImm(server, char, imm) {
    return new Promise((resolve, reject) => {
      this.getCharImm(server, char, imm)
        .then(i => {
          const sql = "DELETE FROM character_immunities WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, i.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getCharSense(char, sense) {
    return new Promise((resolve, reject) => {
      if (!sense) {
        const sql = "SELECT * FROM character_senses WHERE char_id = $1";
        this.query(sql, [char.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Character Senses found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (sense.id) {
          const sql = "SELECT * FROM character_senses WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, sense.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character Sense not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM character_senses WHERE char_id = $1 AND name = $2";
          this.query(sql, [char.id, sense.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Character Sense not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addCharSense(char, sense) {
    return new Promise((resolve, reject) => {
      this.getCharSense(char, sense)
        .then(reject("Error 409: Duplicate Character Sense"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO character_senses (char_id, name, range) VALUES ($1, $2, $3)";
            this.query(sql, [char.id, sense.name, sense.range])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remCharSense(char, sense) {
    return new Promise((resolve, reject) => {
      this.getCharSense(char, sense)
        .then(sen => {
          const sql = "DELETE FROM character_senses WHERE char_id = $1 AND id = $2";
          this.query(sql, [char.id, sen.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateCharSense(char, sense) {
    return new Promise((resolve, reject) => {
      this.getCharSense(char, sense)
        .then(sen => {
          const sql = "UPDATE character_senses SET name = $1, range = $2 WHERE char_id = $3 AND id = $4";
          this.query(sql, [sense.name, sense.range, char.id, sen.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getArmor(server, armor) {
    return new Promise((resolve, reject) => {
      if (!armor) {
        const sql = "SELECT * FROM armors WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Armor found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (armor.id) {
          const sql = "SELECT * FROM armors WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, armor.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Armor not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM armors WHERE server_id = $1 AND name = $2";
          this.query(sql, [server.id, armor.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Armor not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(reject("Error 409: Duplicate Armor"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO armors (server_id, name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
            this.query(sql, [server.id, armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(arm => {
          const sql = "DELETE FROM armors WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, arm.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateArmor(server, armor) {
    return new Promise((resolve, reject) => {
      this.getArmor(server, armor)
        .then(arm => {
          const sql = "UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE server_id = $12 AND id = $13";
          this.query(sql, [armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune, armor.attune_req, server.id, arm.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getFeat(server, feat) {
    return new Promise((resolve, reject) => {
      if (!feat) {
        const sql = "SELECT * FROM feats WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Feats found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (feat.id) {
          const sql = "SELECT * FROM feats WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, feat.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Feat not found");
              } else if (results.length === 0) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM feats WHERE server_id = $1 AND name = $2";
          this.query(sql, [server.id, feat.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Feat not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addFeat(server, feat) {
    return new Promise((resolve, reject) => {
      this.getFeat(server, feat)
        .then(reject("Error 409: Duplicate Feat"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO feats (server_id, name, description, type, val1, val2, val3) VALUES($1, $2, $3, $4, $5, $6, $7)";
            this.query(sql, [server.id, feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3])
              .then(resolve("Success"))
              .catch(err => reject(err));
          } else {
            reject(err);
          }
        });
    });
  }

  remFeat(server, feat) {
    return new Promise((resolve, reject) => {
      this.getFeat(server, feat)
        .then(f => {
          const sql = "DELETE FROM feats WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, f.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateFeat(server, feat) {
    return new Promise((resolve, reject) => {
      this.getFeat(server, feat)
        .then(f => {
          const sql = "UPDATE feats SET name = $1, description = $2, type = $3, val1 = $4, val2 = $5, val3 = $6 WHERE server_id = $7 AND id = $8";
          this.query(sql, [feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3, server.id, f.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getClass(server, clas) {
    return new Promise((resolve, reject) => {
      if (!clas) {
        const sql = "SELECT * FROM classes WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Classes found");
            } else if (results.length >= 1) {
              const classes = []
              classes.push({
                name: c.name,
                hitdice: c.hitdice,
                hitdice_size: c.hitdice_size,
                caster: c.caster,
                cast_lvl: c.cast_lvl,
                sub: c.sub,
                profs: {
                  armor: [],
                  lang: [],
                  skill: [],
                  tool: [],
                  weapon: []
                },
                saves: [],
                senses: [],
                traits: []
              });
              let num = 0;
              for (const c of results) {
                this.getClassProf(server, c)
                  .then(profs => classes[num].profs = profs)
                  .catch(console.error);
                this.getClassSave(server, c)
                  .then(saves => classes[num].saves = saves)
                  .catch(console.error);
                this.getClassSense(server, c)
                  .then(senses => classes[num].senses = senses)
                  .catch(console.error);
                this.getClassTrait(server, c)
                  .then(traits => classes[num].traits = traits)
                  .catch(console.error);
                num++;
              }
              resolve(classes);
            }
          })
          .catch(err => reject(err));
      } else {
        if (clas.id) {
          const sql = "SELECT * FROM classes WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, clas.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Class not found");
              } else if (results.length === 1) {
                const c = results[0];
                const classes = {
                  name: c.name,
                  hitdice: c.hitdice,
                  hitdice_size: c.hitdice_size,
                  caster: c.caster,
                  cast_lvl: c.cast_lvl,
                  sub: c.sub,
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  saves: [],
                  senses: [],
                  traits: []
                };
                this.getClassProf(server, c)
                  .then(profs => classes.profs = profs)
                  .catch(console.error);
                this.getClassSave(server, c)
                  .then(saves => classes.saves = saves)
                  .catch(console.error);
                this.getClassSense(server, c)
                  .then(senses => classes.senses = senses)
                  .catch(console.error);
                this.getClassTrait(server, c)
                  .then(traits => classes.traits = traits)
                  .catch(console.error);
                resolve(classes);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM classes WHERE server_id = $1 AND name = $2";
          this.query(sql, [server.id, clas.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Class not found");
              } else if (results.length === 1) {
                const c = results[0];
                const classes = {
                  name: c.name,
                  hitdice: c.hitdice,
                  hitdice_size: c.hitdice_size,
                  caster: c.caster,
                  cast_lvl: c.cast_lvl,
                  sub: c.sub,
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  saves: [],
                  senses: [],
                  traits: []
                };
                this.getClassProf(server, c)
                  .then(profs => classes.profs = profs)
                  .catch(console.error);
                this.getClassSave(server, c)
                  .then(saves => classes.saves = saves)
                  .catch(console.error);
                this.getClassSense(server, c)
                  .then(senses => classes.senses = senses)
                  .catch(console.error);
                this.getClassTrait(server, c)
                  .then(traits => classes.traits = traits)
                  .catch(console.error);
                resolve(classes);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addClass(server, clas) {
    //TODO: Copy from GitHub
  }

  remClass(server, clas) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          const sql = "DELETE FROM classes WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, c.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateClass(server, clas) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          const sql = "UPDATE classes SET name = $1, description = $2, hitdice = $3, hitdice_size = $4, caster = $5, cast_lvl = $6, sub = $7 WHERE server_id = $8 AND id = $9";
          this.query(sql, [clas.name, clas.description, clas.hitdice, clas.hitdice_size, clas.caster, clas.cast_lvl, clas.sub, server.id, c.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getClassTrait(server, clas, trait) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          if (!trait) {
            const sql = "SELECT * FROM class_traits WHERE server_id = $1 AND class_id = $2";
            this.query(sql, [server.id, c.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Class Traits found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (trait.id) {
              const sql = "SELECT * FROM class_traits WHERE server_id = $1 AND class_id = $2 AND id = $3";
              this.query(sql, [server.id, c.id, trait.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Trait not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM class_traits WHERE server_id = $1 AND class_id = $2 AND name = $3";
              this.query(sql, [server.id, c.id, trait.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Trait not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addClassTrait(server, clas, trait) {
    return new Promise((resolve, reject) => {
      this.getClassTrait(server, clas, trait)
        .then(reject("Error 409: Duplicate Class Trait"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO class_traits (server_id, class_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
            this.query(sql, [server.id, clas.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remClassTrait(server, clas, trait) {
    return new Promise((resolve, reject) => {
      this.getClassTrait(server, clas, trait)
        .then(t => {
          const sql = "DELETE FROM class_traits WHERE server_id = $1 AND class_id = $2 AND id = $3";
          this.query(sql, [server.id, clas.id, t.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateClassTrait(server, clas, trait) {
    return new Promise((resolve, reject) => {
      this.getClassTrait(server, clas, trait)
        .then(t => {
          const sql = "UPDATE class_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE server_id = $12 AND class_id = $13 AND id = $14";
          this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, server.id, clas.id, t.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getClassFeat(server, clas, char, feat) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          if (!feat) {
            const sql = "SELECT * FROM class_feats WHERE char_id = $1 AND class_id = $2";
            this.query(sql, [char.id, c.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Class Feats found");
                } else if (results.length >= 1) {
                  const feats = [];
                  for (const f of results) {
                    this.getFeat(server, f)
                      .then(fea => feats.push({
                        name: fea.name,
                        description: fea.description,
                        class: c.name,
                        visible: fea.visible,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(feats.push({
                        feat_id: f.id,
                        class: c.name,
                        state: "Invalid"
                      }));
                  }
                  resolve(feats);
                }
              })
              .catch(err => reject(err));
          } else {
            if (feat.feat_id) {
              const sql = "SELECT * FROM class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3";
              this.query(sql, [char.id, c.id, feat.feat_id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Feat not found");
                  } else if (results.length === 1) {
                    const f = results[0];
                    this.getFeat(server, { id: f.feat_id })
                      .then(fea => resolve({
                        name: fea.name,
                        description: fea.description,
                        class: c.name,
                        visible: fea.visible,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(reject("Error 400: Invalid Feat"));
                  }
                })
                .catch(err => reject(err));
            } else if (feat.id) {
              const sql = "SELECT * FROM class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3";
              this.query(sql, [char.id, c.id, feat.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Feat not found");
                  } else if (results.length === 1) {
                    const f = results[0]
                    this.getFeat(server, { id: f.feat_id })
                      .then(fea => resolve({
                        name: fea.name,
                        description: fea.description,
                        class: c.name,
                        visible: fea.visible,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(reject("Error 400: Invalid Feat"));
                  }
                })
                .catch(err => reject(err));
            } else {
              this.getFeat(server, { name: feat.name })
                .then(fea => {
                  const sql = "SELECT * FROM class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3";
                  this.query(sql, [char.id, c.id, fea.id])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Class Feat not found");
                      } else if (results.length === 1) {
                        resolve({
                          name: fea.name,
                          description: fea.description,
                          class: c.name,
                          visible: fea.visible,
                          id: results[0].id,
                          feat_id: fea.id,
                          state: "Valid"
                        });
                      }
                    })
                    .catch(err => reject(err));
                })
                .catch(reject("Error 400: Invalid Feat"));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addClassFeat(server, clas, char, feat) {
    return new Promise((resolve, reject) => {
      this.getClassFeat(server, clas, char, feat)
        .then(reject("Error 409: Duplicate Class Feat"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getFeat(server, feat)
              .then(fea => {
                const sql = "INSERT INTO class_feats (char_id, class_id, feat_id) VALUES ($1, $2, $3)";
                this.query(sql, [char.id, clas.id, fea.id])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remClassFeat(server, clas, char, feat) {
    return new Promise((resolve, reject) => {
      this.getClassFeat(server, clas, char, feat)
        .then(f => {
          const sql = "DELETE FROM class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3";
          this.query(sql, [char.id, clas.id, f.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getClassProf(server, clas, prof) {
    //TODO: Copy from GitHub
  }

  addClassProf(server, clas, prof) {
    //TODO: Copy from GitHub
  }

  remClassProf(server, clas, prof) {
    //TODO: Copy from GitHub
  }

  updateClassProf(server, clas, prof) {
    //TODO
  }

  getClassSave(server, clas, save) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          if (!save) {
            const sql = "SELECT * FROM class_saves WHERE server_id = $1 AND class_id = $2";
            this.query(sql, [server.id, c.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Class Saves");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (save.stat) {
              const sql = "SELECT * FROM class_saves WHERE server_id = $1 AND class_id = $2 AND stat = $3";
              this.query(sql, [server.id, c.id, save.stat])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Save not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addClassSave(server, clas, save) {
    return new Promise((resolve, reject) => {
      this.getClassSave(server, clas, save)
        .then(reject("Error 409: Duplicate Class Saves"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO class_saves (class_id, server_id, stat, level) VALUES($1, $2, $3, $4)";
            this.query(sql, [clas.id, server.id, save.stat, save.level])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remClassSave(server, clas, save) {
    return new Promise((resolve, reject) => {
      this.getClassSave(server, clas, save)
        .then(function() {
          const sql = "DELETE FROM class_saves WHERE server_id = $1 AND class_id = $2 AND stat = $3";
          this.query(sql, [server.id, clas.id, save.stat])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateClassSave(server, clas, save) {
    return new Promise((resolve, reject) => {
      this.getClassSave(server, clas, save)
        .then(s => {
          const sql = "UPDATE clas_saves SET stat = $1, level = $2 WHERE server_id = $3 AND class_id = $4 AND stat = $5";
          this.query(sql, [save.stat, save.level, server.id, clas.id, s.stat])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getClassSense(server, clas, sense) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          if (!sense) {
            const sql = "SELECT * FROM class_senses WHERE server_id = $1 AND class_id = $2";
            this.query(sql, [server.id, clas.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Class Senses found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
          } else {
            if (sense.id) {
              const sql = "SELECT * FROM class_senses WHERE server_id = $1 AND class_id = $2 AND id = $3";
              this.query(sql, [server.id, clas.id, sense.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM class_senses WHERE server_id = $1 AND class_id = $2 AND name = $3";
              this.query(sql, [server.id, clas.id, sense.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Class Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addClassSense(server, clas, sense) {
    return new Promise((resolve, reject) => {
      this.getClassSense(server, clas, sense)
        .then(reject("Error 409: Duplicate Class Sense"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO class_senses (server_id, class_id, name, range) VALUES($1, $2, $3, $4)";
            this.getClass(server, clas)
              .then(c => {
                this.query(sql, [server.id, c.id, sense.name, sense.range])
                  .then(resolve("Success"))
                  .catch(err => reject(err));
              })
              .catch(err => reject(err));
          } else {
            reject(err);
          }
        });
    });
  }

  remClassSense(server, clas, sense) {
    return new Promise((resolve, reject) => {
      this.getClassSense(server, clas, sense)
        .then(s => {
          const sql = "DELETE FROM class_senses WHERE server_id = $1 AND class_id = $2 AND id = $3";
          this.query(sql, [server.id, s.class_id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateClassSense(server, clas, sense) {
    return new Promise((resolve, reject) => {
      this.getCharSense(server, clas, sense)
        .then(s => {
          const sql = "UPDATE class_senses name = $1, range = $2 WHERE server_id = $3 AND class_id = $4 AND id = $5";
          this.query(sql, [sense.name, sense.range, server.id, s.class_id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSubclass(server, clas, sub) {
    return new Promise((resolve, reject) => {
      this.getClass(server, clas)
        .then(c => {
          if (!c.sub) {
            reject("Error 400: Invalid Request");
          } else {
            if (!sub) {
              const sql = "SELECT * FROM subclasses WHERE server_id = $1 AND class_id = $2";
              this.query(sql, [server.id, c.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: No Subclasses found");
                  } else if (results.length >= 1) {
                    const subs = [];
                    let num = 0;
                    for (const s of results) {
                      subs.push({
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        class: c.name,
                        class_id: c.id,
                        caster: s.caster,
                        cast_lvl: s.cast_lvl,
                        profs: {
                          armor: [],
                          lang: [],
                          skill: [],
                          tool: [],
                          weapon: []
                        },
                        senses: [],
                        traits: []
                      });
                      this.getSubclassProf(server, sub)
                        .then(profs => subs[num].profs = profs)
                        .catch(console.error);
                      this.getSubclassSense(server, sub)
                        .then(senses => subs[num].senses = senses)
                        .catch(console.error);
                      this.getSubclassTrait(server, sub)
                        .then(traits => subs[num].traits = traits)
                        .catch(console.error);
                      num++;
                    }
                    resolve(subs);
                  }
                })
                .catch(err => reject(err));
            } else {
              if (sub.id) {
                const sql = "SELECT * FROM subclasses WHERE server_id = $1 AND class_id = $2 AND id = $3";
                this.query(sql, [server.id, c.id, sub.id])
                  .then(results => {
                    if (results.length === 0) {
                      reject("Error 404: Subclass not found");
                    } else if (results.length === 1) {
                      const s = results[0];
                      const subs = {
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        class: c.name,
                        class_id: c.id,
                        caster: s.caster,
                        cast_lvl: s.cast_lvl,
                        profs: {
                          armor: [],
                          lang: [],
                          skill: [],
                          tool: [],
                          weapon: []
                        },
                        senses: [],
                        traits: []
                      }
                      this.getSubclassProf(server, sub)
                        .then(profs => subs.profs = profs)
                        .catch(console.error);
                      this.getSubclassSense(server, sub)
                        .then(senses => subs.senses = senses)
                        .catch(console.error);
                      this.getSubclassTrait(server, sub)
                        .then(traits => subs.traits = traits)
                        .catch(console.error);
                      resolve(subs);
                    }
                  })
                  .catch(err => reject(err));
              } else {
                const sql = "SELECT * FROM subclasses WHERE server_id = $1 AND class_id = $2 AND name = $3";
                this.query(sql, [server.id, c.id, sub.name])
                  .then(results => {
                    if (results.length === 0) {
                      reject("Error 404: Subclass not found");
                    } else if (results.length === 1) {
                      const s = results[0];
                      const subs = {
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        class: c.name,
                        class_id: c.id,
                        caster: s.caster,
                        cast_lvl: s.cast_lvl,
                        profs: {
                          armor: [],
                          lang: [],
                          skill: [],
                          tool: [],
                          weapon: []
                        },
                        senses: [],
                        traits: []
                      }
                      this.getSubclassProf(server, sub)
                        .then(profs => subs.profs = profs)
                        .catch(console.error);
                      this.getSubclassSense(server, sub)
                        .then(senses => subs.senses = senses)
                        .catch(console.error);
                      this.getSubclassTrait(server, sub)
                        .then(traits => subs.traits = traits)
                        .catch(console.error);
                      resolve(subs);
                    }
                  })
                  .catch(err => reject(err));
              }
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addSubclass(server, clas, sub) {
    //TODO: Copy from GitHub
  }

  remSubclass(server, clas, sub) {
    return new Promise((resolve, reject) => {
      this.getSubclass(server, clas, sub)
        .then(s => {
          const sql = "DELETE FROM subclasses WHERE server_id = $1 AND class_id = $2 AND id = $3";
          this.query(sql, [server.id, s.class_id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubclass(server, clas, sub) {
    return new Promise((resolve, reject) => {
      this.getSubclass(server, clas, sub)
        .then(s => {
          const sql = "UPDATE subclasses SET name = $1, description = $2, caster = $3, cast_lvl = $4 WHERE server_id = $5 AND class_id = $6 AND id = $7";
          this.query(sql, [sub.name, sub.description, sub.caster, sub.cast_lvl, server.id, s.class_id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSubclassTrait(server, sub, trait) {
    return new Promise((resolve, reject) => {
      if (!trait) {
        const sql = "SELECT * FROM subclass_traits WHERE server_id = $1 AND sub_id = $2";
        this.query(sql, [server.id, sub.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Subclass Traits found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err));
      } else {
        if (trait.id) {
          const sql = "SELECT * FROM subclass_traits WHERE server_id = $1 AND sub_id = $2 AND id = $3";
          this.query(sql, [server.id, sub.id, trait.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Subclass Trait not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM subclass_traits WHERE server_id = $1 AND sub_id = $2 AND name = $3";
          this.query(sql, [server.id, sub.id, trait.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Subclass Trait not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addSubclassTrait(server, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getSubclassTrait(server, sub, trait)
        .then(reject("Error 409: Duplicate Subclass Trait"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO subclass_traits (sub_id, server_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
            this.query(sql, [sub.id, server.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remSubclassTrait(server, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getSubclassTrait(server, sub, trait)
        .then(function() {
          const sql = "DELETE FROM subclass_traits WHERE server_id = $1 AND sub_id = $2 AND id = $3";
          this.query(sql, [server.id, sub.id, trait.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubclassTrait(server, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getSubclassTrait(server, sub, trait)
        .then(function() {
          const sql = "UPDATE subclass_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg-dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE server_id = $12 AND sub_id = $13 AND id = $14";
          this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, server.id, sub.id, trait.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    })
  }

  getSubclassProf(server, sub, prof) {
    //TODO: Copy from GitHub
  }

  addSubclassProf(server, sub, prof) {
    //TODO: Copy from GitHub
  }

  remSubclassProf(server, sub, prof) {
    //TODO: Copy from GitHub
  }

  updateSubclassProf(server, sub, prof) {
    //TODO: Copy from GitHub
  }

  getSubclassSense(server, sub, sense) {
    return new Promise((resolve, reject) => {
      if (!sense) {
        const sql = "SELECT * FROM subclass_senses WHERE server_id = $1 AND sub_id = $2";
        this.query(sql, [server.id, sub.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Subclass Senses found");
            } else if (results.length >= 1) {
              resolve(results);
            }
          })
          .catch(err => reject(err))
      } else {
        if (sense.id) {
          const sql = "SELECT * FROM subclass_senses WHERE server_id = $1 AND sub_id = $2 AND id = $3";
          this.query(sql, [server.id, sub.id, sense.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Subclass Sense not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM subclass_senses WHERE server_id = $1 AND sub_id = $2 AND name = $3";
          this.query(sql, [server.id, sub.id, sense.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Subclass Sense not found");
              } else if (results.length === 1) {
                resolve(results[0]);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addSubclassSense(server, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubclassSense(server, sub, sense)
        .then(reject("Error 409: Duplicate Subclass Sense"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO subclass_senses (server_id, sub_id, name, range) VALUES($1, $2, $3, $4)";
            this.query(sql, [server.id, sub.id, sense.name, sense.range])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remSubclassSense(server, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubclassSense(server, sub, sense)
        .then(s => {
          const sql = "DELETE FROM subclass_senses WHERE server_id = $1 AND sub_id = $2 AND id = $3";
          this.query(sql, [server.id, sub.id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubclassSense(server, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubclassSense(server, sub, sense)
        .then(s => {
          const sql = "UPDATE subclass_senses SET name = $1, range = $2 WHERE server_id = $3 AND sub_id = $4 AND id = $5";
          this.query(sql, [sense.name, sense.range, server.id, sub.id, s.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRace(server, race) {
    return new Promise((resolve, reject) => {
      if (!race) {
        const sql = "SELECT * FROM races WHERE server_id = $1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Races found");
            } else if (results.length >= 1) {
              const list = [];
              let num = 0;
              for (const r of results) {
                list.push({
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  speed: r.speed,
                  sub: Boolean(r.sub),
                  asi: [],
                  feats: [],
                  imm: [],
                  res: [],
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  senses: [],
                  traits: []
                });
                this.getRaceASI(server, race)
                  .then(asi => list[num].asi = asi)
                  .catch(console.error);
                this.getRaceFeat(server, race)
                  .then(feats => list[num].feats = feats)
                  .catch(console.error);
                this.getRaceImm(server, race)
                  .then(imm => list[num].imm = imm)
                  .catch(console.error);
                this.getRaceRes(server, race)
                  .then(res => list[num].res = res)
                  .catch(console.error);
                this.getRaceProf(server, race)
                  .then(profs => list[num].profs = profs)
                  .catch(console.error);
                this.getRaceSense(server, race)
                  .then(senses => list[num].senses = senses)
                  .catch(console.error);
                this.getRaceTrait(server, race)
                  .then(traits => list[num].traits = traits)
                  .catch(console.error);
                num++;
              }
              resolve(list);
            }
          })
          .catch(err => reject(err));
      } else {
        if (race.id) {
          const sql = "SELECT * FROM races WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, race.id])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Race not found");
              } else if (results.length === 1) {
                const r = results[0];
                const list = {
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  speed: r.speed,
                  sub: Boolean(r.sub),
                  asi: [],
                  feats: [],
                  imm: [],
                  res: [],
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  senses: [],
                  traits: []
                }
                this.getRaceASI(server, race)
                  .then(asi => list.asi = asi)
                  .catch(console.error);
                this.getRaceFeat(server, race)
                  .then(feats => list.feats = feats)
                  .catch(console.error);
                this.getRaceImm(server, race)
                  .then(imm => list.imm = imm)
                  .catch(console.error);
                this.getRaceRes(server, race)
                  .then(res => list.res = res)
                  .catch(console.error);
                this.getRaceProf(server, race)
                  .then(profs => list.profs = profs)
                  .catch(console.error);
                this.getRaceSense(server, race)
                  .then(senses => list.senses = senses)
                  .catch(console.error);
                this.getRaceTrait(server, race)
                  .then(traits => list.traits = traits)
                  .catch(console.error);
                resolve(list);
              }
            })
            .catch(err => reject(err));
        } else {
          const sql = "SELECT * FROM races WHERE server_id = $1 AND name = $2";
          this.query(sql, [server.id, race.name])
            .then(results => {
              if (results.length === 0) {
                reject("Error 404: Race not found");
              } else if (results.length === 1) {
                const r = results[0];
                const list = {
                  id: r.id,
                  name: r.name,
                  description: r.description,
                  speed: r.speed,
                  sub: r.sub,
                  asi: [],
                  feats: [],
                  imm: [],
                  res: [],
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  senses: [],
                  traits: []
                }
                this.getRaceASI(server, race)
                  .then(asi => list.asi = asi)
                  .catch(console.error);
                this.getRaceFeat(server, race)
                  .then(feats => list.feats = feats)
                  .catch(console.error);
                this.getRaceImm(server, race)
                  .then(imm => list.imm = imm)
                  .catch(console.error);
                this.getRaceRes(server, race)
                  .then(res => list.res = res)
                  .catch(console.error);
                this.getRaceProf(server, race)
                  .then(profs => list.profs = profs)
                  .catch(console.error);
                this.getRaceSense(server, race)
                  .then(senses => list.senses = senses)
                  .catch(console.error);
                this.getRaceTrait(server, race)
                  .then(traits => list.traits = traits)
                  .catch(console.error);
                resolve(list);
              }
            })
            .catch(err => reject(err));
        }
      }
    });
  }

  addRace(server, race) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(reject("Error 409: Duplicate Race"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO races (server_id, name, description, speed, sub) VALUES($1, $2, $3, $4)";
            this.query(sql, [server.id, race.name, race.description, race.speed, race.sub])
              .then(function() {
                const logs = {
                  name: race.name,
                  description: race.description,
                  speed: race.speed,
                  sub: race.sub,
                  asi: [],
                  feats: [],
                  imm: [],
                  res: [],
                  profs: {
                    armor: [],
                    lang: [],
                    skill: [],
                    tool: [],
                    weapon: []
                  },
                  senses: [],
                  traits: []
                }
                for (const stat of race.asi) {
                  this.addRaceASI(server, race, stat)
                    .then(logs.asi.push({
                      stat: stat.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.asi.push({
                      stat: stat.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                for (const feat of race.feats) {
                  this.addRaceFeat(server, race, feat)
                    .then(logs.feats.push({
                      name: feat.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.feats.push({
                      name: feat.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                for (const imm of race.imm) {
                  this.addRaceImm(server, race, imm)
                    .then(logs.imm.push({
                      name: imm.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.imm.push({
                      name: imm.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                for (const res of race.res) {
                  this.addRaceRes(server, race, res)
                    .then(logs.res.push({
                      name: res.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.res.push({
                      name: imm.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                for (const prof of race.profs) {
                  this.addRaceProf(server, race, prof)
                    .then(function() {
                      switch (prof.type) {
                        case "armor":
                          logs.profs.armor.push({
                            name: prof.name,
                            state: "Success"
                          });
                          break;
                        case "language":
                          logs.profs.lang.push({
                            name: prof.name,
                            state: "Success"
                          });
                          break;
                        case "skill":
                          logs.profs.skill.push({
                            name: prof.name,
                            state: "Success"
                          });
                          break;
                        case "tool":
                          logs.profs.tool.push({
                            name: prof.name,
                            state: "Success"
                          });
                          break;
                        case "weapon":
                          logs.profs.weapon.push({
                            name: prof.name,
                            state: "Success"
                          });
                          break;
                      }
                    })
                    .catch(err1 => {
                      switch (prof.type) {
                        case "armor":
                          logs.profs.armor.push({
                            name: prof.name,
                            state: "Failed",
                            reason: `${err1}`
                          });
                          break;
                        case "language":
                          logs.profs.lang.push({
                            name: prof.name,
                            state: "Failed",
                            reason: `${err1}`
                          });
                          break;
                        case "skill":
                          logs.profs.skill.push({
                            name: prof.name,
                            state: "Failed",
                            reason: `${err1}`
                          });
                          break;
                        case "tool":
                          logs.profs.tool.push({
                            name: prof.name,
                            state: "Failed",
                            reason: `${err1}`
                          });
                          break;
                        case "weapon":
                          logs.profs.weapon.push({
                            name: prof.name,
                            state: "Failed",
                            reason: `${err1}`
                          });
                          break;
                      }
                    });
                }
                for (const sense of race.senses) {
                  this.addRaceSense(server, race, sense)
                    .then(logs.senses.push({
                      name: sense.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.senses.push({
                      name: sense.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                for (const trait of race.traits) {
                  this.addRaceTrait(server, race, trait)
                    .then(logs.traits.push({
                      name: trait.name,
                      state: "Success"
                    }))
                    .catch(err1 => logs.traits.push({
                      name: trait.name,
                      state: "Failed",
                      reason: `${err1}`
                    }));
                }
                resolve(logs);
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRace(server, race) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          const sql = "DELETE FROM races WHERE server_id = $1 AND id = $2";
          this.query(sql, [server.id, r.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateRace(server, race) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          const sql = "UPDATE races SET name = $1, description = $2, speed = $3, sub = $4 WHERE server_id = $5 AND id = $6";
          this.query(sql, [race.name, race.description, race.speed, race.sub, server.id, r.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceASI(server, race, stat) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!stat) {
            const sql = "SELECT * FROM race_asi WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race ASI found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else if (stat.name) {
            const sql = "SELECT * FROM race_asi WHERE server_id = $1 AND race_id = $2 AND name = $3";
            this.query(sql, [server.id, r.id, stat.name])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: Race ASI not found");
                } else if (results.length === 1) {
                  resolve(results[0]);
                }
              })
              .catch(err => reject(err));
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceASI(server, race, stat) {
    return new Promise((resolve, reject) => {
      this.getRaceASI(server, race, stat)
        .then(s => {
          if (s.val == stat.val) {
            reject("Error 409: Duplicate Race ASI");
          } else {
            this.updateRaceASI(server, race, stat)
              .then(resolve("Success"))
              .catch(err => reject(err));
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO race_asi (server_id, race_id, name, val) VALUES($1, $2, $3, $4)";
            this.query(sql, [server.id, race.id, stat.name, stat.val])
              .then(resolve("Success"))
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRaceASI(server, race, stat) {
    return new Promise((resolve, reject) => {
      this.getRaceASI(server, race, stat)
        .then(function() {
          const sql = "DELETE FROM race_asi WHERE server_id = $1 AND race_id = $2 AND name = $3";
          this.query(sql, [server.id, race.id, stat.name])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateRaceASI(server, race, stat) {
    return new Promise((resolve, reject) => {
      this.getRaceASI(server, race, stat)
        .then(function() {
          const sql = "UPDATE race_asi SET name = $1, val = $2 WHERE server_id = $3 AND race_id = $4";
          this.query(sql, [stat.newname, stat.val, server.id, race.id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceFeat(server, char, race, feat) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!feat) {
            const sql = "SELECT * FROM race_feats WHERE char_id = $1 AND race_id = $2";
            this.query(sql, [char.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race Feats found");
                } else if (results.length >= 1) {
                  const list = [];
                  for (const f of results) {
                    this.getFeat(server, f)
                      .then(fea => list.push({
                        name: fea.name,
                        description: fea.description,
                        type: fea.type,
                        val1: fea.val1,
                        val2: fea.val2,
                        val3: fea.val3,
                        char_id: f.char_id,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(err => list.push({
                        id: f.id,
                        state: "Invalid",
                        reason: `${err}`
                      }));
                  }
                  resolve(list);
                }
              })
              .catch(err => reject(err));
          } else {
            if (feat.feat_id) {
              const sql = "SELECT * FROM race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3";
              this.query(sql, [server.id, r.id, feat.feat_id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Feat not found");
                  } else if (results.length === 1) {
                    const f = results[0];
                    this.getFeat(server, { id: feat.feat_id })
                      .then(fea => resolve({
                        name: fea.name,
                        description: fea.description,
                        type: fea.type,
                        val1: fea.val1,
                        val2: fea.val2,
                        val3: fea.val3,
                        char_id: f.char_id,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(err => reject(err));
                  }
                })
                .catch(err => reject(err));
            } else if (feat.id) {
              const sql = "SELECT * FROM race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [char.id, r.id, feat.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Feat not found");
                  } else if (results.length === 1) {
                    const f = results[0];
                    this.getFeat(server, { id: feat.feat_id })
                      .then(fea => resolve({
                        name: fea.name,
                        description: fea.description,
                        type: fea.type,
                        val1: fea.val1,
                        val2: fea.val2,
                        val3: fea.val3,
                        char_id: f.char_id,
                        id: f.id,
                        feat_id: fea.id,
                        state: "Valid"
                      }))
                      .catch(err => reject(err));
                  }
                })
                .catch(err => reject(err));
            } else {
              this.getFeat(server, { name: feat.name })
                .then(fea => {
                  const sql = "SELECT * FROM race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3";
                  this.query(sql, [char.id, r.id, fea.id])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Race Feat not found");
                      } else if (results.length === 1) {
                        const f = results[0];
                        resolve({
                          name: fea.name,
                          description: fea.description,
                          type: fea.type,
                          val1: fea.val1,
                          val2: fea.val2,
                          val3: fea.val3,
                          char_id: f.char_id,
                          id: f.id,
                          feat_id: fea.id,
                          state: "Valid"
                        });
                      }
                    })
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceFeat(server, char, race, feat) {
    return new Promise((resolve, reject) => {
      this.getRaceFeat(server, char, race, feat)
        .then(reject("Error 409: Duplicate Race Feat"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getRace(server, race)
              .then(r => {
                this.getFeat(server, { name: feat.name })
                  .then(fea => {
                    const sql = "INSERT INTO race_feats (char_id, race_id, feat_id) VALUES($1, $2, $3)";
                    this.query(sql, [char.id, r.id, fea.id])
                      .then(resolve("Success"))
                      .catch(err1 => reject(err1));
                  })
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRaceFeat(server, char, race, feat) {
    return new Promise((resolve, reject) => {
      this.getRaceFeat(server, char, race, feat)
        .then(f => {
          this.getRace(server, race)
            .then(r => {
              const sql = "DELETE FROM race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [char.id, r.id, f.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceImm(server, race, imm) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!imm) {
            const sql = "SELECT * FROM race_immunities WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race Immunities found");
                } else if (results.length >= 1) {
                  const imms = [];
                  for (const i of results) {
                    this.getCondOrDmgtype(server, i.type, { id: i.imm_id })
                      .then(im => imms.push({
                        name: im.name,
                        type: i.type,
                        id: i.id,
                        imm_id: im.id,
                        state: "Valid"
                      }))
                      .catch(err => imms.push({
                        type: i.type,
                        id: i.id,
                        state: "Invalid",
                        reason: `${err}`
                      }));
                  }
                  resolve(imms);
                }
              })
              .catch(err => reject(err));
          } else {
            if (imm.imm_id) {
              const sql = "SELECT * FROM race_immunities WHERE server_id = $1 AND race_id = $2 AND imm_id = $3";
              this.query(sql, [server.id, r.id, imm.imm_id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Immunity not found");
                  } else if (results.length === 1) {
                    const i = results[0];
                    this.getCondOrDmgtype(server, i.type, { id: i.imm_id })
                      .then(im => resolve({
                        name: im.name,
                        type: i.type,
                        id: i.id,
                        imm_id: im.id,
                        state: "Valid"
                      }))
                      .catch(reject(`Error 400: Invalid Immunity`));
                  }
                })
                .catch(err => reject(err));
            } else if (imm.id) {
              const sql = "SELECT * FROM race_immunities WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, imm.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Immunity not found");
                  } else if (results.length === 1) {
                    const i = results[0];
                    this.getCondOrDmgtype(server, i.type, { id: i.imm_id })
                      .then(im => resolve({
                        name: im.name,
                        type: i.type,
                        id: i.id,
                        imm_id: i.imm_id,
                        state: "Valid"
                      }))
                      .catch(reject("Error 400: Invalid Immunity"));
                  }
                })
                .catch(err => reject(err));
            } else {
              this.getCondOrDmgtype(server, imm.type, { name: imm.name })
                .then(im => {
                  const sql = "SELECT * FROM race_immunities WHERE server_id = $1 AND race_id = $2 AND imm_id = $3";
                  this.query(sql, [server.id, r.id, im.id])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Race Immunity not found");
                      } else if (results.length === 1) {
                        const i = results[0];
                        resolve({
                          name: im.name,
                          type: i.type,
                          id: i.id,
                          imm_id: i.imm_id,
                          state: "Valid"
                        });
                      }
                    })
                    .catch(err => reject(err));
                })
                .catch(reject("Error 400: Invalid Immunity"));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceImm(server, race, imm) {
    return new Promise((resolve, reject) => {
      this.getRaceImm(server, race, imm)
        .then(reject("Error 409: Duplicate Race Immunity"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getRace(server, race)
              .then(r => {
                this.getCondOrDmgtype(server, imm.type, { name: imm.name })
                  .then(im => {
                    this.getRaceRes(server, r, { res_id: im.id })
                      .then(function() {
                        this.remRaceRes(server, r, { res_id: im.id });
                        const sql = "INSERT INTO race_immunities (server_id, race_id, type, imm_id) VALUES($1, $2, $3, $4)";
                        this.query(sql, [server.id, r.id, imm.type, im.id])
                          .then(resolve("Success"))
                          .catch(err1 => reject(err1));
                      })
                      .catch(function() {
                        const sql = "INSERT INTO race_immunities (server_id, race_id, type, imm_id) VALUES($1, $2, $3, $4)";
                        this.query(sql, [server.id, r.id, imm.type, im.id])
                          .then(resolve("Success"))
                          .catch(err1 => reject(err1));
                      });
                  })
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRaceImm(server, race, imm) {
    return new Promise((resolve, reject) => {
      this.getRaceImm(server, race, imm)
        .then(i => {
          this.getRace(server, race)
            .then(r => {
              const sql = "DELETE FROM race_immunities WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, i.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceRes(server, race, res) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!res) {
            const sql = "SELECT * FROM race_resistances WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race Resistances found");
                } else if (results.length >= 1) {
                  const resis = [];
                  for (const re of results) {
                    this.getCondOrDmgtype(server, re.type, { id: re.res_id })
                      .then(resist => resis.push({
                        name: resist.name,
                        type: re.type,
                        id: re.id,
                        res_id: resist.id,
                        state: "Valid"
                      }))
                      .catch(err => resis.push({
                        type: re.type,
                        id: re.id,
                        state: "Invalid",
                        reason: `${err}`
                      }));
                  }
                  resolve(resis);
                }
              })
              .catch(err => reject(err));
          } else {
            if (res.res_id) {
              const sql = "SELECT * FROM race_resistances WHERE server_id = $1 AND race_id = $2 AND res_id = $3";
              this.query(sql, [server.id, r.id, res.res_id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Resistance not found");
                  } else if (results.length === 1) {
                    const re = results[0];
                    this.getCondOrDmgtype(server, re.type, { id: re.res_id })
                      .then(resist => resolve({
                        name: resist.name,
                        type: re.type,
                        id: re.id,
                        res_id: resist.id,
                        state: "Valid"
                      }))
                      .catch(reject("Error 400: Invalid Resistance"));
                  }
                })
                .catch(err => reject(err));
            } else if (res.id) {
              const sql = "SELECT * FROM race_resistances WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, res.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Resistance not found");
                  } else if (results.length === 1) {
                    const re = results[0];
                    this.getCondOrDmgtype(server, re.type, { id: re.res_id })
                      .then(resist => resolve({
                        name: resist.name,
                        type: re.type,
                        id: re.id,
                        res_id: resist.id,
                        state: "Valid"
                      }))
                      .catch(reject("Error 400: Invalid Resistance"));
                  }
                })
            } else {
              this.getCondOrDmgtype(server, res.type, { name: res.name })
                .then(resist => {
                  const sql = "SELECT * FROM race_resistances WHERE server_id = $1 AND race_id = $2 AND res_id = $3";
                  this.query(sql, [server.id, r.id, resist.id])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Race Resistance not found");
                      } else if (results.length === 1) {
                        const re = results[0];
                        resolve({
                          name: resist.name,
                          type: re.type,
                          id: re.id,
                          res_id: resist.id,
                          state: "Valid"
                        });
                      }
                    })
                    .catch(err => reject(err));
                })
                .catch(reject("Error 400: Invalid Resistance"));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceRes(server, race, res) {
    return new Promise((resolve, reject) => {
      this.getCondOrDmgtype(server, res.type, { name: res.name })
        .then(resist => {
          this.getRace(server, race)
            .then(r => {
              this.getRaceImm(server, r, { imm_id: resist.res_id })
                .then(reject("Error 409: Race Immunity of that Type already exists"))
                .catch(function() {
                  this.getRaceRes(server, r, res)
                    .then(reject("Error 409: Duplicate Race Resistance"))
                    .catch(err => {
                      if (String(err).includes("Error 404")) {
                        const sql = "INSERT INTO race_resistances (server_id, race_id, type, res_id) VALUES($1, $2, $3, $4)";
                        this.query(sql, [server.id, r.id, res.type, resist.id])
                          .then(resolve("Success"))
                          .catch(err1 => reject(err1));
                      } else {
                        reject(err);
                      }
                    });
                });
            })
            .catch(err => reject(err));
        })
        .catch(reject("Error 400: Invalid Resistance"));
    });
  }

  remRaceRes(server, race, res) {
    return new Promise((resolve, reject) => {
      this.getRaceRes(server, race, res)
        .then(re => {
          this.getRace(server, race)
            .then(r => {
              const sql = "DELETE FROM race_resistances WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, re.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceProf(server, race, prof) {
    //TODO: Copy from GitHub
  }

  addRaceProf(server, race, prof) {
    //TODO: Copy from GitHub
  }

  remRaceProf(server, race, prof) {
    //TODO: Copy from GitHub
  }

  updateRaceProf(server, race, prof) {
    //TODO
  }

  getRaceSense(server, race, sense) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!sense) {
            const sql = "SELECT * FROM race_senses WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race Senses found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (sense.id) {
              const sql = "SELECT * FROM race_senses WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, sense.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM race_senses WHERE server_id = $1 AND race_id = $2 AND name = $3";
              this.query(sql, [server.id, r.id, sense.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceSense(server, race, sense) {
    return new Promise((resolve, reject) => {
      this.getRaceSense(server, race, sense)
        .then(reject("Error 409: Duplicate Race Sense"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getRace(server, race)
              .then(r => {
                const sql = "INSERT INTO race_senses (server_id, race_id, name, range) VALUES($1, $2, $3, $4)";
                this.query(sql, [server.id, r.id, sense.name, sense.range])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRaceSense(server, race, sense) {
    return new Promise((resolve, reject) => {
      this.getRaceSense(server, race, sense)
        .then(s => {
          this.getRace(server, race)
            .then(r => {
              const sql = "DELETE FROM race_senses WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, s.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateRaceSense(server, race, sense) {
    return new Promise((resolve, reject) => {
      this.getRaceSense(server, race, sense)
        .then(s => {
          this.getRace(server, race)
            .then(r => {
              const sql = "UPDATE race_senses SET name = $1, range = $2 WHERE server_id = $3 AND race_id = $4 AND id = $5";
              this.query(sql, [sense.name, sense.range, server.id, r.id, s.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getRaceTrait(server, race, trait) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!trait) {
            const sql = "SELECT * FROM race_traits WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Race Traits found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (trait.id) {
              const sql = "SELECT * FROM race_traits WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, trait.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Trait not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM race_traits WHERE server_id = $1 AND race_id = $2 AND name = $3";
              this.query(sql, [server.id, r.id, trait.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Race Trait not found");
                  } else if (results.length === 1) {
                    resolve(results[0])
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addRaceTrait(server, race, trait) {
    return new Promise((resolve, reject) => {
      this.getRaceTrait(server, race, trait)
        .then(reject("Error 409: Duplicate Race Trait"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getRace(server, race)
              .then(r => {
                const sql = "INSERT INTO race_traits (server_id, race_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
                this.query(sql, [server.id, r.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  remRaceTrait(server, race, trait) {
    return new Promise((resolve, reject) => {
      this.getRaceTrait(server, race, trait)
        .then(t => {
          this.getRace(server, race)
            .then(r => {
              const sql = "DELETE FROM race_traits WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, t.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateRaceTrait(server, race, trait) {
    return new Promise((resolve, reject) => {
      this.getRaceTrait(server, race, trait)
        .then(t => {
          this.getRace(server, race)
            .then(r => {
              const sql = "UPDATE race_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE server_id = $12 AND race_id = $13 AND id = $14";
              this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, server.id, r.id, t.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSubrace(server, race, sub) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          if (!sub) {
            const sql = "SELECT * FROM subraces WHERE server_id = $1 AND race_id = $2";
            this.query(sql, [server.id, r.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Subraces found");
                } else if (results.length >= 1) {
                  const subs = [];
                  let num = 0;
                  for (const s of results) {
                    subs.push({
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      race: s.race_id,
                      profs: {
                        armor: [],
                        lang: [],
                        skill: [],
                        tool: [],
                        weapon: []
                      },
                      senses: [],
                      traits: []
                    });
                    this.getSubraceProf(server, r, s)
                      .then(profs => subs[num].profs = profs)
                      .catch(console.error);
                    this.getSubraceSense(server, r, s)
                      .then(senses => subs[num].senses = senses)
                      .catch(console.error);
                    this.getSubraceTrait(server, r, s)
                      .then(traits => subs[num].traits = traits)
                      .catch(console.error);
                    num++;
                  }
                  resolve(subs);
                }
              })
              .catch(err => reject(err));
          } else {
            if (sub.id) {
              const sql = "SELECT * FROM subraces WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, sub.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Subrace not found");
                  } else if (results.length === 1) {
                    const s = results[0];
                    const subs = {
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      race: s.race_id,
                      profs: {
                        armor: [],
                        lang: [],
                        skill: [],
                        tool: [],
                        weapon: []
                      },
                      senses: [],
                      traits: []
                    }
                    this.getSubraceProf(server, r, s)
                      .then(profs => subs.profs = profs)
                      .catch(console.error);
                    this.getSubraceSense(server, r, s)
                      .then(senses => subs.senses = senses)
                      .catch(console.error);
                    this.getSubraceTrait(server, r, s)
                      .then(traits => subs.traits = traits)
                      .catch(console.error);
                    resolve(subs);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM subraces WHERE server_id = $1 AND race_id = $2 AND name = $3";
              this.query(sql, [server.id, r.id, sub.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Subrace not found");
                  } else if (results.length === 1) {
                    const s = results[0];
                    const subs = {
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      race: s.race_id,
                      profs: {
                        armor: [],
                        lang: [],
                        skill: [],
                        tool: [],
                        weapon: []
                      },
                      senses: [],
                      traits: []
                    }
                    this.getSubraceProf(server, r, s)
                      .then(profs => subs.profs = profs)
                      .catch(console.error);
                    this.getSubraceSense(server, r, s)
                      .then(senses => subs.senses = senses)
                      .catch(console.error);
                    this.getSubraceTrait(server, r, s)
                      .then(traits => subs.traits = traits)
                      .catch(console.error);
                    resolve(subs);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addSubrace(server, race, sub) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(reject("Error 409: Duplicate Subrace"))
            .catch(err => {
              if (String(err).includes("Error 404")) {
                const sql = "INSERT INTO subraces (server_id, race_id, name, description) VALUES($1, $2, $3, $4)";
                this.query(sql, [server.id, r.id, sub.name, sub.description])
                  .then(function() {
                    const logs = {
                      name: sub.name,
                      description: sub.description,
                      race: s.race_id,
                      prof: {
                        armor: [],
                        lang: [],
                        skill: [],
                        tool: [],
                        weapon: []
                      },
                      sense: [],
                      trait: []
                    }
                    for (const prof of sub.profs) {
                      this.addSubraceProf(server, r, sub, prof)
                        .then(function() {
                          switch (prof.type) {
                            case "armor":
                              logs.prof.armor.push({
                                name: prof.name,
                                state: "Success"
                              });
                              break;
                            case "language":
                              logs.prof.lang.push({
                                name: prof.name,
                                state: "Success"
                              });
                              break;
                            case "skill":
                              logs.prof.skill.push({
                                name: prof.name,
                                state: "Success"
                              });
                              break;
                            case "tool":
                              logs.prof.tool.push({
                                name: prof.name,
                                state: "Success"
                              });
                              break;
                            case "weapon":
                              logs.prof.weapon.push({
                                name: prof.name,
                                state: "Success"
                              });
                              break;
                          }
                        })
                        .catch(err1 => {
                          switch (prof.type) {
                            case "armor":
                              logs.prof.armor.push({
                                name: prof.name,
                                state: "Failed",
                                reason: `${err1}`
                              });
                              break;
                            case "language":
                              logs.prof.lang.push({
                                name: prof.name,
                                state: "Failed",
                                reason: `${err1}`
                              });
                              break;
                            case "skill":
                              logs.prof.skill.push({
                                name: prof.name,
                                state: "Failed",
                                reason: `${err1}`
                              });
                              break;
                            case "tool":
                              logs.prof.tool.push({
                                name: prof.name,
                                state: "Failed",
                                reason: `${err1}`
                              });
                              break;
                            case "weapon":
                              logs.prof.weapon.push({
                                name: prof.name,
                                state: "Failed",
                                reason: `${err1}`
                              });
                              break;
                          }
                        });
                    }
                    for (const sense of sub.senses) {
                      this.addSubraceSense(server, r, sub, sense)
                        .then(logs.sense.push({
                          name: sense.name,
                          state: "Success"
                        }))
                        .catch(err1 => logs.sense.push({
                          name: sense.name,
                          state: "Failed",
                          reason: `${err1}`
                        }));
                    }
                    for (const trait of sub.traits) {
                      this.addSubraceTrait(server, r, sub, trait)
                        .then(logs.trait.push({
                          name: trait.name,
                          state: "Success"
                        }))
                        .catch(err1 => logs.trait.push({
                          name: trait.name,
                          state: "Failed",
                          reason: `${err1}`
                        }));
                    }
                    resolve(logs);
                  })
                  .catch(err => reject(err));
              } else {
                reject(err);
              }
            });
        })
        .catch(err => reject(err));
    });
  }

  remSubrace(server, race, sub) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              const sql = "DELETE FROM subraces WHERE server_id = $1 AND race_id = $2 AND id = $3";
              this.query(sql, [server.id, r.id, s.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubrace(server, race, sub) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              const sql = "UPDATE subraces SET name = $1, description = $2 WHERE server_id = $3 AND race_id = $4 AND id = $5";
              this.query(sql, [sub.name, sub.description, server.id, r.id, s.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSubraceProf(server, race, sub, prof) {
    //TODO: Copy from GitHub
  }

  addSubraceProf(server, race, sub, prof) {
    //TODO: Copy from GitHub
  }

  remSubraceProf(server, race, sub, prof) {
    //TODO: Copy from GitHub
  }

  updateSubraceProf(server, race, sub, prof) {
    //TODO: Copy from GitHub
  }

  getSubraceSense(server, race, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubrace(server, race, sub)
        .then(s => {
          if (!sense) {
            const sql = "SELECT * FROM subrace_senses WHERE server_id = $1 AND sub_id = $2";
            this.query(sql, [server.id, s.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Subrace Senses found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            if (sense.id) {
              const sql = "SELECT * FROM subrace_senses WHERE server_id = $1 AND sub_id = $2 AND id = $3";
              this.query(sql, [server.id, s.id, sense.id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Subrace Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            } else {
              const sql = "SELECT * FROM subrace_senses WHERE server_id = $1 AND sub_id = $2 AND name = $3";
              this.query(sql, [server.id, s.id, sense.name])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: Subrace Sense not found");
                  } else if (results.length === 1) {
                    resolve(results[0]);
                  }
                })
                .catch(err => reject(err));
            }
          }
        })
        .catch(err => reject(err));
    });
  }

  addSubraceSense(server, race, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubrace(server, race, sub)
        .then(s => {
          this.getSubraceSense(server, race, s, sense)
            .then(reject("Error 409: Duplicate Subrace Sense"))
            .catch(err => {
              if (String(err).includes("Error 404")) {
                const sql = "INSERT INTO subrace_senses (server_id, sub_id, name, range) VALUES($1, $2, $3, $4)";
                this.query(sql, [server.id, s.id, sense.name, sense.range])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              } else {
                reject(err);
              }
            });
        })
        .catch(err => reject(err));
    });
  }

  remSubraceSense(server, race, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubrace(server, race, sub)
        .then(s => {
          this.getSubraceSense(server, race, s, sense)
            .then(sen => {
              const sql = "DELETE FROM subrace_senses WHERE server_id = $1 AND sub_id = $2 AND id = $3";
              this.query(sql, [server.id, s.id, sen.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubraceSense(server, race, sub, sense) {
    return new Promise((resolve, reject) => {
      this.getSubrace(server, race, sub)
        .then(s => {
          this.getSubraceSense(server, race, s, sense)
            .then(sen => {
              const sql = "UPDATE subrace_senses SET name = $1, range = $2 WHERE server_id = $3 AND sub_id = $4 AND id = $5";
              this.query(sql, [sense.name, sense.range, server.id, s.id, sen.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSubraceTrait(server, race, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              if (!trait) {
                const sql = "SELECT * FROM subrace_traits WHERE server_id = $1 AND sub_id = $2";
                this.query(sql, [server.id, s.id])
                  .then(results => {
                    if (results.length === 0) {
                      reject("Error 404: No Subrace Traits found");
                    } else if (results.length >= 1) {
                      resolve(results);
                    }
                  })
                  .catch(err => reject(err));
              } else {
                if (trait.id) {
                  const sql = "SELECT * FROM subrace_traits WHERE server_id = $1 AND sub_id = $2 AND id = $3";
                  this.query(sql, [server.id, s.id, trait.id])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Subrace Trait not found");
                      } else if (results.length === 0) {
                        resolve(results[0]);
                      }
                    })
                    .catch(err => reject(err));
                } else {
                  const sql = "SELECT * FROM subrace_traits WHERE server_id = $1 AND sub_id = $2 AND name = $3";
                  this.query(sql, [server.id, s.id, trait.name])
                    .then(results => {
                      if (results.length === 0) {
                        reject("Error 404: Subrace Trait not found");
                      } else if (results.length === 1) {
                        resolve(results[0]);
                      }
                    })
                    .catch(err => reject(err));
                }
              }
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  addSubraceTrait(server, race, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              this.getSubraceTrait(server, r, s, trait)
                .then(reject("Error 409: Duplicate Subrace Trait"))
                .catch(err => {
                  if (String(err).includes("Error 404")) {
                    const sql = "INSERT INTO subrace_traits (server_id, sub_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
                    this.query(sql, [server.id, s.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])
                      .then(resolve("Success"))
                      .catch(err1 => reject(err1));
                  } else {
                    reject(err);
                  }
                });
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  remSubraceTrait(server, race, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              this.getSubraceTrait(server, r, s, trait)
                .then(t => {
                  const sql = "DELETE FROM subrace_traits WHERE server_id = $1 AND sub_id = $2 AND id = $3";
                  this.query(sql, [server.id, s.id, t.id])
                    .then(resolve("Success"))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSubraceTrait(server, race, sub, trait) {
    return new Promise((resolve, reject) => {
      this.getRace(server, race)
        .then(r => {
          this.getSubrace(server, r, sub)
            .then(s => {
              this.getSubraceTrait(server, r, s, trait)
                .then(t => {
                  const sql = "UPDATE subrace_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE server_id = $12 AND sub_id = $13 AND id = $14";
                  this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, server.id, s.id, t.id])
                    .then(resolve("Success"))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getSession(server, user, session) {
    return new Promise((resolve, reject) => {
      if (!user) {

      } else {
        this.getGM(server, user)
          .then(gm => {
            if (!session) {
              const sql = "SELECT * FROM sessions WHERE server_id = $1 AND dm_id = $2";
              this.query(sql, [server.id, gm.user_id])
                .then(results => {
                  if (results.length === 0) {
                    reject("Error 404: No Sessions found");
                  } else if (results.length >= 1) {
                    resolve(results);
                  }
                })
                .catch(err => reject(err));
            } else {
              if (session.id) {
                const sql = "SELECT * FROM sessions WHERE server_id = $1 AND dm_id = $2 AND id = $3";
                this.query(sql, [server.id, gm.user_id, session.id])
                  .then(results => {
                    if (results.length === 0) {
                      reject("Error 404: Session not found");
                    } else if (results.length === 1) {
                      resolve(results[0]);
                    }
                  })
                  .catch(err => reject(err));
              } else {
                const sql = "SELECT * FROM sessions WHERE server_id = $1 AND dm_id = $2 AND name = $3";
                this.query(sql, [server.id, gm.user_id, session.name])
                  .then(results => {
                    if (results.length === 0) {
                      reject("Error 404: Session not found");
                    } else if (results.length >= 1) {
                      resolve(results);
                    }
                  })
                  .catch(err => reject(err));
              }
            }
          })
          .catch(err => reject(err));
      }
    });
  }

  addSession(server, user, session) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(gm => {
          this.getSession(server, user, session)
            .then(function() {
              this.getServer(server)
                .then(s => {
                  if (s.dup_sessions) {
                    let date = moment().format("YYYY-MM-DD HH:mm:ss");
                    const sql = "INSERT INTO sessions (server_id, dm_id, name, description, levels, players, min_runtime, max_runtime, start_time, date, channel, difficulty) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
                    this.query(sql, [server.id, gm.user_id, session.name, session.description, session.levels, session.players, session.min_runtime, session.max_runtime, session.start_time, date, session.channel, session.difficulty])
                      .then(resolve("Success"))
                      .catch(err => reject(err));
                  } else {
                    reject("Error 409: Duplicate Session");
                  }
                })
                .catch(err => reject(err));
            })
            .catch(err => {
              if (String(err).includes("Error 404")) {
                let date = moment().format("YYYY-MM-DD HH:mm:ss");
                const sql = "INSERT INTO sessions (server_id, dm_id, name, description, levels, players, min_runtime, max_runtime, start_time, date, channel, difficulty) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
                this.query(sql, [server.id, gm.user_id, session.name, session.description, session.levels, session.players, session.min_runtime, session.max_runtime, session.start_time, date, session.channel, session.difficulty])
                  .then(resolve("Success"))
                  .catch(err1 => reject(err1));
              } else {
                reject(err);
              }
            });
        })
        .catch(err => reject(err));
    });
  }

  remSession(server, user, session) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(gm => {
          this.getSession(server, user, session)
            .then(ses => {
              const sql = "DELETE FROM sessions WHERE server_id = $1 AND dm_id = $2 AND id = $3";
              this.query(sql, [server.id, gm.user_id, ses.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  updateSession(server, user, session) {
    return new Promise((resolve, reject) => {
      this.getGM(server, user)
        .then(gm => {
          this.getSession(server, user, session)
            .then(ses => {
              const sql = "UPDATE sessions SET name = $1, description = $2, levels = $3, players = $4, min_runtime = $5, max_runtime = $6, start_time = $7, end_time = $8, channel = $9, difficulty = $10, started = $11, ended = $12 WHERE server_id = $13 AND dm_id = $14 AND id = $15";
              this.query(sql, [session.name, session.description, session.levels, session.players, session.min_runtime, session.max_runtime, session.start_time, session.end_time, session.channel, session.difficulty, session.started, session.ended, server.id, gm.user_id, ses.id])
                .then(resolve("Success"))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getPlayers(server, gm, session, player) {
    return new Promise((resolve, reject) => {
      this.getSession(server, gm, session)
        .then(s => {
          if (!player) {
            const sql = "SELECT * FROM session_players WHERE session_id = $1";
            this.query(sql, [s.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: No Players found");
                } else if (results.length >= 1) {
                  resolve(results);
                }
              })
              .catch(err => reject(err));
          } else {
            const sql = "SELECT * FROM session_players WHERE session_id = $1 AND user_id = $2 AND char_id = $3";
            this.query(sql, [s.id, player.user.id, player.char.id])
              .then(results => {
                if (results.length === 0) {
                  reject("Error 404: Player not found");
                } else if (results.length === 1) {
                  resolve(results[0]);
                }
              })
              .catch(err => reject(err));
          }
        })
        .catch(err => reject(err));
    });
  }

  joinSession(server, user, char, gm, session) {
    return new Promise((resolve, reject) => {
      this.getPlayer(server, gm, session, { user: user, char: char })
        .then(reject("Error 409: Duplicate Player"))
        .catch(err => {
          if (String(err).includes("Error 404")) {
            this.getUser(server, user)
              .then(u => {
                this.getChar(u, char)
                  .then(c => {
                    this.getSession(server, gm, session)
                      .then(s => {
                        const sql = "INSERT INTO session_players (session_id, user_id, char_id) VALUES($1, $2, $3)";
                        this.query(sql, [s.id, u.id, c.id])
                          .then(resolve("Success"))
                          .catch(err1 => reject(err1));
                      })
                      .catch(err1 => reject(err1));
                  })
                  .catch(err1 => reject(err1));
              })
              .catch(err1 => reject(err1));
          } else {
            reject(err);
          }
        });
    });
  }

  leaveSession(server, user, char, gm, session) {
    return new Promise((resolve, reject) => {
      this.getPlayers(server, gm, session, { user: user, char: char })
        .then(p => {
          const sql = "DELETE FROM session_players WHERE session_id = $1 AND user_id = $2 AND char_id = $3";
          this.query(sql, [p.session_id, p.user_id, p.char_id])
            .then(resolve("Success"))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  getLog(server, log) {
    return new Promise((resolve, reject) => {
      if (!log) {
        const sql = "SELECT * FROM server_logs WHERE server_id = $1 ORDER BY id DESC LIMIT 1";
        this.query(sql, [server.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Logs found");
            } else if (results.length === 1) {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      } else if (log) {
        const sql = "SELECT * FROM server_logs WHERE server_id = $1 ORDER BY ABS(EXTRACT(epoch FROM id - $2)) LIMIT 1";
        this.query(sql, [server.id, log.id])
          .then(results => {
            if (results.length === 0) {
              reject("Error 404: No Logs found");
            } else {
              resolve(results[0]);
            }
          })
          .catch(err => reject(err));
      }
    })
  }

  addLog(server) {
    return new Promise((resolve, reject) => {
      let id = moment().format("YYYY-MM-DDTHH:mm:ss.msZ");
      this.getLog(server, {id: id})
        .then(log => {
          let olddate = moment(log.id);
          let newdate = moment();
          const diff = moment.duration(newdate.diff(olddate));
          const days = diff.asDays();
          const hours = diff.asHours();
          const sql = "INSERT INTO server_logs (server_id, id) VALUES ($1, $2)";
          if (days>=1) {
            this.query(sql, [server.id, id])
              .then(resolve(`New Log has been added to Server \"${server.name}\"!`))
              .catch(err => reject(err));
            if (!fs.existsSync(`./logs/server/${server.id}`)) {
              fs.mkdirSync(`./logs/server/${server.id}`);
            }
            fs.writeFileSync(`./logs/server/${server.id}/${id}.log`, "========Beginning of new Log========\n");
          } else if (hours>=8) {
            this.query(sql, [server.id, id])
              .then(resolve(`New Log has been added to Server \"${server.name}\"!`))
              .catch(err => reject(err));
            if (!fs.existsSync(`./logs/server/${server.id}`)) {
              fs.mkdirSync(`./logs/server/${server.id}`);
            }
            fs.writeFileSync(`./logs/server/${server.id}/${id}.log`, "========Beginning of new Log========\n");
          } else {
            reject("Error 400: Logfile is too new!");
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            const sql = "INSERT INTO server_logs (server_id, id) VALUES ($1, $2)";
            this.query(sql, [server.id, id])
              .then(resolve(`New Log has been added to Server \"${server.name}\"!`))
              .catch(err1 => reject(err1));
            if (!fs.existsSync(`./logs/server/${server.id}`)) {
              fs.mkdirSync(`./logs/server/${server.id}`);
            }
            fs.writeFileSync(`./logs/server/${server.id}/${id}.log`, "========Beginning of new Log========\n");
          } else {
            reject(err);
          }
        });
    })
  }

  remLog(server) {
    return new Promise((resolve, reject) => {
      const sql0 = "SELECT COUNT(id) FROM server_logs WHERE server_id = $1";
      this.query(sql0, [server.id])
        .then(result => {
          if (result[0]>1) {
            const sql2 = "SELECT id FROM server_logs WHERE server_id = $1 ORDER BY id ASC LIMIT 1";
            this.query(sql2, [server.id])
              .then(results => {
                let id = results[0].id;
                const sql1 = "DELETE FROM server_logs WHERE server_id = $1 AND id = $2";
                this.query(sql1, [server.id, id])
                  .then(resolve(`Oldest Log of Server \"${server.name}\" has been deleted!`))
                  .catch(err => reject(err));
                if (fs.existsSync(`./logs/server/${server.id}/${id}.log`)) {
                  fs.unlinkSync(`./logs/server/${server.id}/${id}.log`);
                } else {
                  reject("Error 404: Logfile not found");
                }
              })
              .catch(err => reject(err));
          }
        })
        .catch(err => reject(err));
    });
  }

  writeLog(server, content) {
    return new Promise((resolve, reject) => {
      this.getLog(server, undefined)
        .then(log => {
          let time = moment().format("YYYY-MM-DD HH:mm:ss");
          if (!fs.existsSync(`./logs/server/${server.id}`)) {
            fs.mkdirSync(`./logs/server/${server.id}`);
          }
          if (!fs.existsSync(`./logs/server/${server.id}/${log.id}.log`)) {
            fs.writeFileSync(`./logs/server/${server.id}/${log.id}.log`, "========Beginning of new Log========\n");
          }
          fs.appendFileSync(`./logs/server/${server.id}/${log.id}.log`, time + " - " +  content + "\n");
          resolve(`Successfully wrote into Logfile of Server \"${server.name}\"`);
        })
        .catch(err => reject(`Unable to write into Logfile of Server \"${server.name}\"\nReason:\n${err}`));
    })
  }

  writeDevLog(content) {
    if (!fs.existsSync("./logs/dev/")) {
      fs.mkdirSync("./logs/dev");
    }
    if (!fs.existsSync("./logs/dev/devlog.log")) {
      fs.writeFileSync("./logs/dev/devlog.log", content);
    } else {
      let time = moment().format("YYYY-MM-DD HH:mm:ss")
      fs.appendFileSync("./logs/dev/devlog.log", time + " - " + content + "\n");
    }
  }

  resetDevLog() {
    return new Promise((resolve, reject) => {
      if (fs.existsSync("./logs/dev/devlog.log")) {
        fs.writeFileSync("./logs/dev/devlog.log", "\ ");
        resolve("Success");
      } else {
        reject("Error 404: Logfile not found");
      }
    })
  }
}
const psql = new PSQL();

export default psql;