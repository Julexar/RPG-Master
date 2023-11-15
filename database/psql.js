import pkg from "pg";
const Pool = pkg.Pool;
import "dotenv/config";
import moment from "moment"
import { config } from "../config.js"
import fs from "fs";
import { BadRequestError, DuplicateError, ForbiddenError, InternalServerError, NotFoundError } from "../custom/errors/index.js";
import { get } from "http";

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
        return this.writeDevLog(`${err}`);
      }
      this.writeDevLog("Connected to Database!");
    });
  }

  query(query, params = []) {
    return new Promise((resolve, reject) => {
      this.pool.query(query, params, (err, results) => {
        if (err) {
          return reject(new InternalServerError("Something went wrong!", err));
        }

        if (query.includes("SELECT")) {
          results = JSON.parse(JSON.stringify(results.rows));
        }
        resolve(results);
      });
    });
  };

  async getServer(server) {
    if (!server) {

      const results = await this.query("SELECT * FROM servers")
      
      if (results.length === 0) {
        throw new NotFoundError("No Servers found", "Could not find any Servers in the Database!");
      }

      return results;
    } else {

      const results = await this.query("SELECT * FROM servers WHERE id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
      }
      
      return results[0];
    }
  };

  async addServer(server) {
    if (await this.serverExists(server)) {
      throw new DuplicateError("Duplicate Server", "This Server already exists in the Database!");
    }

    const sql = "INSERT INTO servers (id, name, dm_role) VALUES ($1, $2, $3)";
    await this.query(sql, [server.id, server.name, server.dm_role])

    return `Successfully added Server \"${server.name}\" to Database`;
  };

  async remServer(server) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    await this.query("DELETE FROM servers WHERE id = $1", [server.id])

    return `Successfully removed Server \"${server.name}\" from Database`;
  };

  async serverExists(server) {
    const results = await this.query("SELECT * FROM servers WHERE id = $1", [server.id])

    return results.length > 0;
  };

  async updateServer(server) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "UPDATE servers SET name = $1, dm_role = $2 WHERE id = $3";

    await this.query(sql, [server.name, server.dm_role, server.id])

    return `Successfully updated Server \"${server.name}\" in Database`;
  };

  async setDupSessions(server, bool) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "UPDATE servers SET dup_sessions = $1 WHERE id = $2";
    await this.query(sql, [bool, server.id])

    return `Successfully set duplicate Sessions to ${bool}`;
  };

  async setSumChannel(server, channel) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "UPDATE servers SET sum_chan = $1 WHERE id = $2";
    await this.query(sql, [channel.id, server.id])

    return `Successfully set Summary Channel to <#${channel.id}>`
  };

  async setLogChannel(server, channel) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "UPDATE servers SET log_chan = $1 WHERE id = $2";
    await this.query(sql, [channel.id, server.id])

    return `Succesfully changed the Log Channel to <#${channel.id}>`;
  };

  async setGMEdit(server, bool) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }
    
    const sql = "UPDATE servers SET gm_edit = $1 WHERE id = $2";
    await this.query(sql, [bool, server.id]);

    return `Successfully set the Ability for GMs to edit to ${bool}`;
  };

  async getStaffRole(server, type, role) {
    if (!type && !role) {
      const sql = "SELECT admin_role, mod_role FROM servers WHERE id = $1";
      const results = await this.query(sql, [server.id])
      
      if (results.length === 0) {
        throw new NotFoundError("No Staff Roles found", "Could not find any Staff Roles in the Database!");
      }

      return results;
    } else if (type && !role) {
      const sql = `SELECT ${type}_role FROM servers WHERE server_id = $1`;
      const results = await this.query(sql, [server.id])

      if (results.length === 0) {
        throw new NotFoundError("Staff Role not found", "Could not find that Staff Role in the Database!");
      }

      return results[0];
    }
  };

  async setStaffRole(server, type, role) {
    return await this.getStaffRole(server, type)
    .then(async (staffRole) => {
      if ((staffRole.admin_role || staffRole.mod_role) && (staffRole.admin_role == role.id || staffRole.mod_role == role.id)) {
        throw new DuplicateError("Duplicate Staff Role", "This Staff Role already exists in the Database!");
      }

      const sql = `UPDATE servers SET ${type}_role = $1 WHERE id = $2`;
      await this.query(sql, [role.id, server.id])

      return `Successfully set ${type} role to <@&${role.id}>`;
    })
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = `UPDATE servers SET ${type}_role = $1 WHERE id = $2`;
      await this.query(sql, [role.id, server.id])

      return `Successfully set ${type} role to <@&${role.id}>`;
    });
  };

  async getDMRole(server) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "SELECT dm_role FROM servers WHERE id = $1";
    const results = await this.query(sql, [server.id])

    if (results.length === 0 || !results[0]) {
      throw new NotFoundError("No GM Role found", "Could not find a GM Role in the Database!");
    }

    return results[0];
  };

  async setDMRole(server, role) {
    return this.getDMRole(server)
    .then(async (dmRoleID) => {
      if (dmRoleID == role.id) {
        throw new DuplicateError("Duplicate GM Role", "This GM Role already exists in the Database!");
      }

      const sql = "UPDATE servers SET dm_role = $1 WHERE id = $2";
      await this.query(sql, [role.id, server.id])

      return `Successfully set gm role to <@&${role.id}>`;
    })
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "UPDATE servers SET dm_role = $1 WHERE id = $2";
      await this.query(sql, [role.id, server.id])

      return `Successfully set gm role to <@&${role.id}>`;
    });
  };

  async toggleLogs(server, bool) {
    if (!(await this.serverExists(server))) {
      throw new NotFoundError("Server not found", "Could not find that Server in the Database!");
    }

    const sql = "UPDATE servers SET print_logs = $1 WHERE id = $2";
    await this.query(sql, [bool, server.id])

    return `Successfully set automatic printing of logs to ${bool}`;
  };

  async getGM(server, user) {
    if (!user) {
      const results = await this.query("SELECT * FROM gms WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No GMs found", "Could not find any GMs in the Database!");
      }

      return results;
    }

    const sql = "SELECT * FROM gms WHERE server_id = $1 AND user_id = $2";
    const results = await this.query(sql, [server.id, user.id])

    if (results.length === 0) {
      throw new NotFoundError("GM not found", "Could not find that GM in the Database!");
    }

    return results[0];
  };

  async gmExists(server, user) {
    const sql = "SELECT * FROM gms WHERE server_id = $1 AND user_id = $2";
    const results = await this.query(sql, [server.id, user.id])

    return results.length === 1;
  };

  async addGM(server, user) {
    if (await this.gmExists(server, user)) {
      throw new DuplicateError("Duplicate GM", "That GM already exists in the Database!");
    }

    const date = moment().format("YYYY-MM-DD HH:mm:ss");
    const sql = "INSERT INTO gms (server_id, user_id, date) VALUES ($1, $2, $3)";
    await this.query(sql, [server.id, user.id, date])
    
    return `Successfully registered \"${user.displayName}\" as GM in Database`;
  };

  async remGM(server, user) {
    if (!(await this.gmExists(server, user))) {
      throw new NotFoundError("GM not found", "Could not find that GM in the Database!");
    }

    const sql = "DELETE FROM gms WHERE server_id = $1 AND user_id = $2";
    await this.query(sql, [server.id, user.id])
    
    return `Successfully unregistered \"${user.displayName} as GM in Database`;
  };

  async editGMXP(server, user, xp) {
    const gm = await this.getGM(server, user)

    if (gm.xp - xp < 0) {
      throw new ForbiddenError("Not enough XP", "You do not have enough GMXP!");
    } else {
      gm.xp += xp;
    }

    const sql = "UPDATE gms SET xp = $1 WHERE server_id = $2 AND user_id = $3";
    await this.query(sql, [gm.xp, server.id, user.id])
    
    return `Successfully set XP of GM \"${user.displayName}\" to ${gm.xp}`;
  };

  async toggleGMSuggestion(server, user) {
    const gm = await this.getGM(server, user)
    
    const sql = "UPDATE gms SET suggestions = $1 WHERE server_id = $2 AND user_id = $3";
    await this.query(sql, [!gm.suggestions, server.id, user.id])
    
    return `Successfully set receiving of suggestions to ${!gm.suggestions}`;
  };

  async getPrefix(server, prefix) {
    if (!prefix) {
      const sql = "SELECT prefix FROM server_prefix WHERE server_id = $1";
      const results = await this.query(sql, [server.id])

      if (results.length === 0) {
        await this.setPrefixDefault(server)
        return [config.default_prefix];
      } 
      const prefixes = [];
      for (let i = 0; i < results.length; i++) {
        prefixes.push(results[i].prefix);
      }

      return prefixes;
    }

    const sql = "SELECT prefix FROM server_prefix WHERE server_id = $1 AND prefix = $2";
    const results = await this.query(sql, [server.id, prefix])

    if (results.length === 0) {
      throw new NotFoundError("Prefix not found", "Could not find that Prefix in the Database!");
    }

    return results[0].prefix;
  };

  async setPrefixDefault(server) {
    const sql = "INSERT INTO server_prefix (server_id, prefix) VALUES ($1, $2)";
    await this.query(sql, [server.id, config.default_prefix])
    
    return `Successfully added default Prefix \"${config.default_prefix}\" to Server \"${server.name}\"`;
  };

  async prefixExists(server, prefix) {
    const sql = "SELECT prefix FROM server_prefix WHERE server_id = $1 AND prefix = $2";
    const results = await this.query(sql, [server, prefix])

    return results.length === 1;
  };

  async addPrefix(server, prefix) {
    if (await this.prefixExists(server, prefix)) {
      throw new DuplicateError("Duplicate Prefix", "That Prefix already exists in the Database!");
    }

    const sql = "INSERT INTO server_prefix (server_id, prefix) VALUES ($1, $2)";
    await this.query(sql, [server.id, prefix]);

    return `Successfully added Prefix \"${prefix}\" to Server \"${server.name}\"`;
  };

  async remPrefix(server, prefix) {
    if (!(await this.prefixExists(server, prefix))) {
      throw new NotFoundError("Prefix not found", "Could not find that Prefix in the Database!");
    }

    if (!prefix) {
      const sql = "DELETE FROM server_prefix WHERE server_id = $1";
      await this.query(sql, [server.id])

      await this.setPrefixDefault(server)

      return `Successfully reset all prefixes of Server \"${server.name}\"`;
    }

    const sql = "DELETE FROM server_prefix WHERE server_id = $1 AND prefix = $2";
    await this.query(sql, [server.id, prefix])

    return `Successfully removed Prefix \"${prefix}\" from Server \"${server.name}\"`;
  };

  async getStat(stat) {
    if (!stat) {
      const results = await this.query("SELECT * FROM stats")

      if (results.length === 0) {
        throw new NotFoundError("No Stats found", "Could not find any Stats in the Database!");
      }

      return results;
    }

    if (stat.id) {
      const results = await this.query("SELECT * FROM stats WHERE id = $1", [stat.id])

      if (results.length === 0) {
        throw new NotFoundError("Stat not found", "Could not find that Stat in the Database!");
      }

      return results[0];
    }

    if (stat.key) {
      const results = await this.query("SELECT * FROM stats WHERE key = $1", [stat.key])

      if (results.length === 0) {
        throw new NotFoundError("Stat not found", "Could not find a Stat with that key in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM stats WHERE name = $1", [stat.name])

    if (results.length === 0) {
      throw new NotFoundError("Stat not found", "Could not find a Stat with that name in the Database!");
    }

    return results[0];
  };

  async statExists(stat) {
    if (stat.id) {
      const results = await this.query("SELECT * FROM stats WHERE id = $1", [stat.id])

      return results.length === 1;
    }

    if (stat.key) {
      const results = await this.query("SELECT * FROM stats WHERE key = $1", [stat.key])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM stats WHERE name = $1", [stat.name])

    return results.length === 1;
  };

  async addStat(stat) {
    if (await this.statExists(stat)) {
      throw new DuplicateError("Duplicate Stat", "That Stat already exists in the Database!");
    }

    await this.query("INSERT INTO stats (name, key) VALUES($1, $2)", [stat.name, stat.key])

    return "Successfully added Stat to Database";
  };

  async remStat(stat) {
    if (!(await this.statExists(stat))) {
      throw new NotFoundError("Stat not found", "Could not find that Stat in the Database!");
    }

    await this.query("DELETE FROM stats WHERE id = $1", [stat.id])

    return "Successfully removed Stat from Database";
  };

  async getCommand(cmd, type) {
    if (!cmd) {
      const results = await this.query("SELECT * FROM commands WHERE type = $1", [type])
      
      if (results.length === 0) {
        throw new NotFoundError("No Commands found", "Could not find any Commands in the Database!");
      }

      return results;
    }

    if (cmd.id) {
      const results = await this.query("SELECT * FROM commands WHERE id = $1", [cmd.id])
      
      if (results.length === 0) {
        throw new NotFoundError("Command not found", "Could not find that Command in the Database!");
      }

      return results[0];
    }

    const sql = "SELECT * FROM commands WHERE type = $1 AND name = $2";
    const results = await this.query(sql, [type, cmd.name])

    if (results.length === 0) {
      throw new NotFoundError("Command not found", "Could not find that Command in the Database!");
    }

    return results[0];
  };

  async addCommand(cmd, type) {
    const command = await this.getCommand(cmd, type)
    if (command) {
      throw new DuplicateError("Duplicate Command", "That Command already exists in the Database!");
    }

    const sql = "INSERT INTO commands (type, name, enabled) VALUES($1, $2, $3)";
    await this.query(sql, [type, cmd.name, cmd.enabled])

    return `Successfully added ${type} Command \"${cmd.name}\" to Database`;
  };

  async remCommand(cmd, type) {
    const command = await this.getCommand(cmd, type)

    await this.query("DELETE FROM commands WHERE id = $1", [command.id])

    return `Successfully removed ${type} Command \"${c.name}\" from Database`;
  };

  async updateCommand(cmd, type) {
    const command = await this.getCommand(cmd, type)

    const sql = "UPDATE commands SET name = $1, enabled = $2 WHERE id = $3";
    await this.query(sql, [cmd.name, cmd.enabled, command.id])

    return `Successfully updated ${type} Command \"${command.name}\" in Database`;
  };

  async getServCmd(server, cmd) {
    if (!cmd) {
      const sql = "SELECT * FROM server_commands WHERE server_id = $1";
      const results = await this.query(sql, [server.id])

      if (results.length===0) {
        throw new NotFoundError("No Server Commands found", "Could not find any Server Commands in the Database!");
      }

      return results.map(async (servCmd) => {
        const command = await this.getCommand({id: servCmd.cmd_id})

        if (command && (servCmd.enabled && !command.enabled)) {
          return {
            id: servCmd.id,
            cmd_id: command.id,
            name: command.name,
            type: command.type,
            enabled: false,
            restricted: servCmd.restricted
          }
        } else {
          return {
            id: servCmd.id,
            cmd_id: command.id,
            name: command.name,
            type: command.type,
            enabled: servCmd.enabled,
            restricted: servCmd.restricted
          }
        }
      });
    }

    if (cmd.id) {
      const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND id = $2";
      const results = await this.query(sql, [server.id, cmd.id])

      if (results.length === 0) {
        throw new NotFoundError("Server Command not found", "Could not find that Server Command in the Database!");
      }
      cmd = results[0];
      const command = await this.getCommand({id: cmd.cmd_id})

      if (!command.enabled) {
        return [{
          id: cmd.id,
          cmd_id: command.id,
          name: command.name,
          type: command.type,
          enabled: false,
          restricted: cmd.restricted
        }];
      }

      return [{
        id: cmd.id,
        cmd_id: command.id,
        name: command.name,
        type: command.type,
        enabled: cmd.enabled,
        restricted: cmd.restricted
      }];
    }

    if (cmd.cmd_id) {
      const command = await this.getCommand({id: cmd.cmd_id})

      const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2";
      const results = await this.query(sql, [server.id, command.id])

      if (results.length === 0) {
        throw new NotFoundError("Server Command not found", "Could not find that Server Command in the Database!");
      }

      cmd = results[0];

      if (!command.enabled) {
        return [{
          id: cmd.id,
          cmd_id: command.id,
          name: command.name,
          type: command.type,
          enabled: false,
          restricted: cmd.restricted
        }];
      }

      return [{
        id: cmd.id,
        cmd_id: command.id,
        name: command.name,
        type: command.type,
        enabled: cmd.enabled,
        restricted: cmd.restricted
      }];
    }

    if (cmd.name && cmd.type) {
      const command = await this.getCommand(cmd, type)

      const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2";
      const results = await this.query(sql, [server.id, command.id])

      if (results.length === 0) {
        throw new NotFoundError("Server Command not found", "Could not find that Server Command in the Database!");
      }

      cmd = results[0];

      if (!command.enabled) {
        return [{
          id: cmd.id,
          cmd_id: command.id,
          name: command.name,
          type: command.type,
          enabled: false,
          restricted: cmd.restricted
        }];
      }

      return [{
        id: cmd.id,
        cmd_id: command.id,
        name: command.name,
        type: command.type,
        enabled: cmd.enabled,
        restricted: cmd.restricted
      }];
    }
  };

  async servCmdExists(server, cmd) {
    if (cmd.id) {
      const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND id = $2";
      const results = await this.query(sql, [server.id, cmd.id])

      return results.length === 1;
    }

    if (cmd.cmd_id) {
      const sql = "SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2";
      const results = await this.query(sql, [server.id, cmd.cmd_id])

      return results.length === 1;
    }
  };

  async addServCmd(server, cmd) {
    if (await this.servCmdExists(server, cmd)) {
      throw new DuplicateError("Duplicate Server Command", "That Server Command already exists in the Database!");
    }

    if (!cmd.cmd_id && cmd.name) {
      const command = await this.getCommand({name: cmd.name}, cmd.type)

      const sql = "INSERT INTO server_commands (server_id, cmd_id, id, enabled) VALUES($1, $2, $3, $4)";
      await this.query(sql, [server.id, command.id, cmd.id, command.enabled])

      return `Successfully added Command \"${c.name}\" to Server \"${server.name}\" in Database`;
    }

    const command = await this.getCommand({id: cmd.cmd_id}, "slash")

    const sql = "INSERT INTO server_commands (server_id, cmd_id, id, enabled) VALUES($1, $2, $3, $4)";
    await this.query(sql, [server.id, command.id, cmd.id, command.enabled])

    return `Successfully added Command \"${c.name}\" to Server \"${server.name}\" in Database`;
  };

  async remServCmd(server, cmd) {
    const command = await this.getServCmd(server, cmd)

    const sql = "DELETE FROM server_commands WHERE server_id = $1 AND id = $2";
    await this.query(sql, [server.id, command.id])

    return `Successfully removed ${command.type} Command \"${command.name}\" from Server \"${server.name}\" in Database`;
  };

  async toggleServCmd(server, cmd) {
    const command = await this.getServCmd(server, cmd)

    const sql = "UPDATE server_commands SET enabled = $1 WHERE server_id = $2 AND id = $3";
    await this.query(sql, [!command.enabled, server.id, command.id])

    const action = !command.enabled ? "enabled" : "disabled"
    return `Successfully ${action} Command \"${command.name}\" in Server \"${server.name}\"`;
  };

  async restrictServCmd(server, cmd) {
    const command = await this.getServCmd(server, cmd);

    await this.query("UPDATE server_commands SET restricted = $1 WHERE id = $2", [!command.restricted, command.id])

    const action = !command.restricted ? "enabled" : "disabled"
    return `Successfully ${action} restrictions of Command \"${command.name}\" in Server \"${server.name}\"`;
  };

  async getRestriction(cmd, rest) {
    if (!rest) {
      const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1";
      const results = await this.query(sql, [cmd.id])

      if (results.length === 0) {
        throw new NotFoundError("No Restrictions found", "Could not find any Restrictions for that Server Command in the Database!");
      }

      return results.map(restriction => {
        return {
          type: restriction.type,
          id: restriction.id,
          permission: restriction.permission
        }
      });
    }

    if (rest.id) {
      const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2";
      const results = await this.query(sql, [cmd.id, rest.id])

      if (results.length === 0) {
        throw new NotFoundError("Restriction not found", "Could not find that Restriction for that Server Command in the Database!");
      }

      return [{
        type: results[0].type,
        id: results[0].id,
        permission: results[0].permission
      }];
    }

    const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2";
    const results = await this.query(sql, [cmd.id, rest.type])

    if (results.length === 0) {
      throw new NotFoundError("No Restrictions found", "Could not find any Restrictions of that Type for the Server Command in the Database!");
    }

    return results.map(restriction => {
      return {
        type: restriction.type,
        id: restriction.id,
        permission: restriction.permission
      }
    });
  };

  async restrictionExists(cmd, rest) {
    if (rest.id) {
      const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2";
      const results = await this.query(sql, [cmd.id, rest.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2";
    const results = await this.query(sql, [cmd.id, rest.type])

    return results.length > 0;
  };

  async addRestriction(cmd, rest) {
    const restriction = await this.getRestriction(cmd, rest)
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO server_command_restrictions VALUES($1, $2, $3, $4)";
      await this.query(sql, [cmd.id, rest.type, rest.id, rest.permission])

      return `Successfully added restriction to Command \"${cmd.name}\" in Server \"${server.name}\"`;
    });

    if (restriction[0].permission == rest.permission) {
      throw new DuplicateError("Duplicate Restriction", "That Restriction already exists for that Server Command in the Database!");
    }

    const sql = "UPDATE server_command_restrictions SET permission = $1 WHERE cmd_id = $2 AND id = $3";
    await this.query(sql, [rest.permission, cmd.id, rest.id])

    return `Successfully updated restrictions of Command \"${cmd.name}\" in Server \"${server.name}\"`;
  };

  async remRestriction(cmd, rest) {
    if (!(await this.restrictionExists(cmd, rest))) {
      throw new NotFoundError("Restriction not found", "Could not find that Restriction for that Server Command in the Database!");
    }

    const sql = "DELETE FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2 AND id = $3";
    await this.query(sql, [cmd.id, rest.type, rest.id])

    return `Successfully removed restriction of Command \"${cmd.name}\" in Server \"${server.name}\"`;
  };

  async getMember(server, user) {
    if (!user) {
      const sql = "SELECT * FROM server_members WHERE server_id = $1";
      const results = await this.query(sql, [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No Server Members found", "Could not find any Members for that Server in the Database!");
      }

      const query = "SELECT * FROM users WHERE id IN ($1)";
      const users = await this.query(query, [results.map(member => `'${member.user_id}'`).join(',')])
      return users.map(dbUser => {
        return {
          id: dbUser.id,
          name: dbUser.name
        };
      });
    }

    const sql = "SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2";
    const results = await this.query(sql, [server.id, user.id])

    if (results.length === 0) {
      throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
    }

    const dbUser = await this.getUser({ id: results[0].user_id });
    return dbUser;
  };

  async memberExists(server, user) {
    const sql = "SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2";
    const results = await this.query(sql, [server.id, user.id])

    return results.length === 1;
  };

  async addMember(server, user) {
    if (await this.memberExists(server, user)) {
      throw new DuplicateError("Duplicate Server Member", `The User \"${user.username}\" is already a Member of the Server \"${server.name}\"!`);
    }
    
    const add_member = "INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)";

    if (await this.userExists(user)) {
      await this.query(add_member, [server.id, user.id])

      return `Successfully added User \"${user.username}\" to Server \"${server.name}\"`;
    }

    await this.addUser(user)

    await this.query(add_member, [server.id, user.id])

    return `Successfully added User \"${user.username}\" to Server \"${server.name}\"`;
  };

  async remMember(server, user) {
    if (!(await this.memberExists())) {
      throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
    }

    const sql = "DELETE FROM server_members WHERE server_id = $1 AND user_id = $2";
    await this.query(sql, [server.id, user.id])

    return `Successfully removed User \"${user.username}\" from Server \"${server.name}\"`;
  };

  async getUser(user) {
    if (user.id) {
      const results = await this.query("SELECT * FROM users WHERE id = $1", [user.id])

      if (results.length === 0) {
        throw new NotFoundError("User not found", "Could not find that User in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM users WHERE name = $1")

    if (results.length === 0) {
      throw new NotFoundError("User not found", "Could not find that User in the Database!");
    }

    return results[0];
  };

  async userExists(user) {
    const results = await this.query("SELECT * FROM users WHERE id = $1", [user.id]);

    return results.length === 1;
  };

  async addUser(user) {
    if (await this.userExists(user)) {
      throw new DuplicateError("Duplicate User", "This User already exists in the Database!");
    }

    const sql = "INSERT INTO users (id, name) VALUES($1, $2)";
    await this.query(sql, [user.id, user.username])

    return `Successfully added User \"${user.username}\" to the Database!`;
  };

  async remUser(user) {
    if (!(await this.userExists(user))) {
      throw new NotFoundError("User not found", "Could not find that User in the Database!");
    }

    await this.query("DELETE FROM users WHERE id = $1", [user.id])

    return `Successfully removed User \"${user.username}\" from the Database!`;
  };

  async updateUser(user, char) {
    if (!(await this.userExists(user))) {
      throw new NotFoundError("User not found", "Could not find that User in the Database!");
    }

    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
    }

    const sql = "UPDATE users SET char_id = $1 WHERE id = $2";
    await this.query(sql, [char.id, user.id])

    return `Successfully updated Character for User \"${user.username}\" in Database`;
  };

  async getServerNote(server, user, note) {
    if (!(await this.userExists(server, user))) {
      throw new NotFoundError("User not found", "Could not find that User in the Database!");
    }

    if (!note) {
      const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2";
      const results = await this.query(sql, [server.id, user.id])

      if (results.length === 0) {
        throw new NotFoundError("No Server Notes found", "Could not find any Server Notes in the Database!");
      }

      return results;
    }

    if (note.id) {
      const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3";
      const results = await this.query(sql, [server.id, user.id, note.id])

      if (results.length === 0) {
        throw new NotFoundError("Server Note not found", "Could not find that Server Note in the Database!");
      }

      return results[0];
    }

    const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3";
    const results = await this.query(sql, [server.id, user.id, note.title])

    if (results.length === 0) {
      throw new NotFoundError("Server Note not found", "Could not find that Server Note in the Database!");
    }

    return results[0];
  };

  async serverNoteExists(server, user, note) {
    if (note.id) {
      const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3";
      const results = await this.query(sql, [server.id, user.id, note.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3";
    const results = await this.query(sql, [server.id, user.id, note.title])

    return results.length === 1;
  };

  async addServerNote(server, user, note) {
    if (!(await this.userExists(user))) {
      throw new NotFoundError("User not found", "Could not find that User in the Database!");
    }

    await this.getServerNote(server, user, note)
    .then(async (serverNote) => {
      if (note.content == serverNote.content) {
        throw new DuplicateError("Duplicate Server Note", "A Server Note with that title and content already exists in the Database!");
      }

      const sql = "INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)";
      await this.query(sql, [server.id, user.id, note.title, note.content, note.private])
    })
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)";
      await this.query(sql, [server.id, user.id, note.title, note.content, note.private])
    });

    return "Succcessfully added Server Note to Database";
  };

  async remServerNote(server, user, note) {
    if (!(await this.serverNoteExists(server, user, note))) {
      throw new NotFoundError("Server Note not found", "Could not find that Server Note in the Database!");
    }

    const sql = "DELETE FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3";
    await this.query(sql, [server.id, user.id, note.id])

    return "Successfully removed Server Note from Database";
  };

  async updateServerNote(server, user, note) {
    if (!(await this.serverNoteExists(server, user, note))) {
      throw new NotFoundError("Server Note not found", "Could not find that Server Note in the Database!");
    }

    const sql = "UPDATE server_note SET title = $1, content = $2, private = $3 WHERE server_id = $4 AND user_id = $5 AND id = $6";
    await this.query(sql, [note.title, note.content, note.private, server.id, user.id, note.id])

    return "Successfully updated Server Note in Database";
  };

  async getGlobalNote(user, note) {
    if (!(await this.userExists(user))) {
      throw NotFoundError("User not found", "Could not find that User in the Database!");
    }

    if (!note) {
      const results = await this.query("SELECT * FROM global_notes WHERE user_id = $1", [user.id])
      
      if (results.length === 0) {
        throw new NotFoundError("No Global Notes found", "Could not find any Global Notes in the Database!");
      }

      return results;
    }

    if (note.id) {
      const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND id = $2";
      const results = await this.query(sql, [user.id, note.id])

      if (results.length === 0) {
        throw new NotFoundError("Global Note not found", "Could not find that Global Note in the Database!");
      }

      return results[0];
    }

    const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND title = $2";
    const results = await this.query(sql, [user.id, note.title])

    if (results.length === 0) {
      throw new NotFoundError("Global Note not found", "Could not find that Global Note in the Database!");
    }

    return results[0];
  };

  async globalNoteExists(user, note) {
    if (note.id) {
      const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND id = $2";
      const results = await this.query(sql, [user.id, note.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM global_notes WHERE user_id = $1 AND title = $2";
    const results = await this.query(sql, [user.id, note.title])

    return results.length === 1;
  };

  async addGlobalNote(user, note) {
    await this.getGlobalNote(user, note)
    .then(async (globalNote) => {
      if (globalNote.content == note.content) {
        throw new DuplicateError("Duplicate Global Note", "A Global Note with that title and content already exists in the Database!");
      }

      const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
      await this.query(sql, [user.id, note.title, note.content, note.private])
    })
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
      await this.query(sql, [user.id, note.title, note.content, note.private])
    });

    return "Successfully added Global Note to Database";
  };

  async remGlobalNote(user, note) {
    if (!(await this.globalNoteExists(user, note))) {
      throw new NotFoundError("Global Note not found", "Could not find that Global Note in the Database!");
    }

    await this.query("DELETE FROM global_notes WHERE user_id = $1 AND id = $2", [user.id, note.id])

    return "Successfully removed Global Note from Database";
  };

  async updateGlobalNote(user, note) {
    if (!(await this.globalNoteExists(user, note))) {
      throw new NotFoundError("Global Note not found", "Could not find that Global Note in the Database!");
    }

    const sql = "UPDATE global_notes SET title = $1, content = $2, private = $3 WHERE user_id = $4 AND id = $5";
    await this.query(sql, [note.title, note.content, note.private, user.id, note.id])

    return "Successfully updated Global Note in Database";
  };

  async getArmor(server, armor) {
    if (!armor) {
      const results = await this.query("SELECT * FROM armors WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No Armor found", "Could not find any Armor in the Database!");
      }

      return results;
    }

    if (armor.id) {
      const sql = "SELECT * FROM armors WHERE server_id = $1 AND id = $2";
      const results = await this.query(sql, [server.id, armor.id])

      if (results.length === 0) {
        throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
      }

      return results[0];
    }
    
    const sql = "SELECT * FROM armors WHERE server_id = $1 AND name = $2";
    const results = await this.query(sql, [server.id, armor.name])

    if (results.length === 0) {
      throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
    }

    return results[0];
  };

  async armorExists(server, armor) {
    if (armor.id) {
      const sql = "SELECT * FROM armors WHERE server_id = $1 AND id = $2";
      const results = await this.query(sql, [server.id, armor.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM armors WHERE server_id = $1 AND name = $2";
    const results = await this.query(sql, [server.id, armor.id])

    return results.length === 1;
  };

  async addArmor(server, armor) {
    if (await this.armorExists(server, armor)) {
      throw new DuplicateError("Duplicate Armor", "This Armor already exists in the Database!");
    }

    const sql = "INSERT INTO armors (server_id, name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    await this.query(sql, [server.id, armor.name, armor.description, armor.type, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req])

    return "Successfully added Armor to Database";
  };

  async remArmor(server, armor) {
    if (!(await this.armorExists(server, armor))) {
      throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
    }

    const sql = "DELETE FROM armors WHERE server_id = $1 AND id = $2";
    await this.query(sql, [server.id, armor.id])

    return "Successfully removed Armor from Database";
  };

  async updateArmor(server, armor) {
    if (!(await this.armorExists(server, armor))) {
      throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
    }

    const sql = "UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE server_id = $12 AND id = $13";
    await this.query(sql, [armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req, server.id, arm.id])
    
    return "Successfully updated Armor in Database";
  };

  async getProficiency(prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM proficiency_types")

      if (results.length === 0) {
        throw new NotFoundError("No Proficiencies found", "Could not find any Proficiencies in the Database!");
      }

      return results;
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM proficiency_types WHERE id = $1", [prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Proficiency not found", "Could not find that Proficiency in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM proficiency_types WHERE key = $1", [prof.key])

    if (results.length === 0) {
      throw new NotFoundError("Proficiency not found", "Could not find a Proficiency with that key in the Database!");
    }

    return results[0];
  };

  async getChar(user, char) {
    if (!char) {
      const results = await this.query("SELECT * FROM characters WHERE user_id = $1", [user.id])

      if (results.length === 0) {
        throw new NotFoundError("No Characters found", "Could not find any Characters in the Database!");
      }

      return results.map(async (character) => {
        return {
          owner: user.id,
          name: character.name,
          ac: character.ac,
          hp: {
            current: character.hp,
            max: character.hp_max,
            temp: character.hp_temp
          },
          portrait: character.portrait,
          init: character.init,
          level: character.level,
          stats: await this.getCharStat(char),
          money: {
            pp: character.pp,
            gp: character.gp,
            ep: character.ep,
            sp: character.sp,
            cp: character.cp
          },
          multi: character.multi,
          armor: character.armor_id,
          race: character.race_id,
          subrace: character.subrace_id,
          class: character.class_id,
          subclass: character.subclass_id,
          class_level: character.class_level,
          mc: [
            {
              id: character.mc1_id,
              level: character.mc1_level,
              sub: character.mc1_sub_id
            },
            {
              id: character.mc2_id,
              level: character.mc2_level,
              sub: character.mc2_sub_id
            },
            {
              id: character.mc2_id,
              level: character.mc2_level,
              sub: character.mc3_sub_id
            }
          ]
        }
      });
    }

    if (char.id) {
      const sql = "SELECT * FROM characters WHERE user_id = $1 AND id = $2";
      const results = await this.query(sql, [user.id, char.id])

      if (results.length === 0) {
        throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
      }

      const dbChar = results[0];
      return {
        owner: user.id,
        name: dbChar.name,
        ac: dbChar.ac,
        hp: {
          current: dbChar.hp,
          max: dbChar.hp_max,
          temp: dbChar.hp_temp
        },
        portrait: dbChar.portrait,
        init: dbChar.init,
        level: dbChar.level,
        stats: await this.getCharStat(char),
        money: {
          pp: dbChar.pp,
          gp: dbChar.gp,
          ep: dbChar.ep,
          sp: dbChar.sp,
          cp: dbChar.cp
        },
        multi: dbChar.multi,
        armor: dbChar.armor_id,
        race: dbChar.race_id,
        subrace: dbChar.subrace_id,
        class: dbChar.class_id,
        subclass: dbChar.subclass_id,
        class_level: dbChar.class_level,
        mc: [
          {
            id: dbChar.mc1_id,
            level: dbChar.mc1_level,
            sub: dbChar.mc1_sub_id
          },
          {
            id: dbChar.mc2_id,
            level: dbChar.mc2_level,
            sub: dbChar.mc2_sub_id
          },
          {
            id: dbChar.mc2_id,
            level: dbChar.mc2_level,
            sub: dbChar.mc3_sub_id
          }
        ]
      };
    }

    const sql = "SELECT * FROM characters WHERE user_id = $1 AND name = $2";
    const results = await this.query(sql, [user.id, char.name])

    const dbChar = results[0];
    return {
      owner: user.id,
      name: dbChar.name,
      ac: dbChar.ac,
      hp: {
        current: dbChar.hp,
        max: dbChar.hp_max,
        temp: dbChar.hp_temp,
        method: dbChar.hp_method
      },
      portrait: dbChar.portrait,
      init: dbChar.init,
      level: dbChar.level,
      stats: await this.getCharStat(char),
      money: {
        pp: dbChar.pp,
        gp: dbChar.gp,
        ep: dbChar.ep,
        sp: dbChar.sp,
        cp: dbChar.cp
      },
      multi: dbChar.multi,
      armor: dbChar.armor_id,
      race: dbChar.race_id,
      subrace: dbChar.subrace_id,
      class: dbChar.class_id,
      subclass: dbChar.subclass_id,
      class_level: dbChar.class_level,
      mc: [
        {
          id: dbChar.mc1_id,
          level: dbChar.mc1_level,
          sub: dbChar.mc1_sub_id,
          enabled: dbChar.mc1_enabled
        },
        {
          id: dbChar.mc2_id,
          level: dbChar.mc2_level,
          sub: dbChar.mc2_sub_id,
          enabled: dbChar.mc2_enabled
        },
        {
          id: dbChar.mc2_id,
          level: dbChar.mc2_level,
          sub: dbChar.mc3_sub_id,
          enabled: dbChar.mc3_enabled
        }
      ]
    };
  };

  async charExists(user, char) {
    if (char.id) {
      const sql = "SELECT * FROM characters WHERE user_id = $1 and id = $2";
      const results = await this.query(sql, [user.id, char.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM characters WHERE user_id = $1 AND name = $2";
    const results = await this.query(sql, [user.id, char.name])

    return results.length > 0;
  };

  async addChar(user, char) {
    if (await this.charExists(user, char)) {
      throw new DuplicateError("Duplicate Character", "A Character with that name already exists in the Database!");
    }

    const sql = "INSERT INTO characters (user_id, name, ac, hp, hp_max, hp_temp, init, level, xp, pp, gp, ep, sp, cp, armor_id, race_id, subrace_id, class_id, subclass_id, class_level, multi, mc1_id, mc1_sub_id, mc1_level, mc2_id, mc2_sub_id, mc2_level, mc3_id, mc3_sub_id, mc3_level) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)";
    await this.query(sql, [user.id, char.name, char.ac, char.hp, char.hp_max, char.hp_temp, char.init, char.level, char.xp, char.money.pp, char.money.gp, char.money.ep, char.money.sp, char.money.cp, char.armor, char.race, char.subrace, char.class, char.subclass, char.class_level, char.multi, char.mc[0].id, char.mc[0].sub, char.mc[0].level, char.mc[1].id, char.mc[1].sub, char.mc[1].level, char.mc[2].id, char.mc[2].sub, char.mc[2].level])

    return `Successfully added Character \"${char.name}\" for User \"${user.username}\" to Database`;
  };

  async remChar(user, char) {
    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
    }

    const sql = "DELETE FROM characters WHERE user_id = $1 AND id = $2";
    await this.query(sql, [user.id, char.id])

    return `Successfully removed Character \"${char.name}\" of User \"${user.username}\" from Database`;
  };

  async setCharXP(user, char, xp) {
    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
    }

    const sql = "UPDATE characters SET xp = $1 WHERE user_id = $3 AND id = $4";
    await this.query(sql, [xp, user.id, char.id])

    return `Successfully set Level of Character \"${char.name}\" to ${Math.ceil(xp/300)-1} (${xp} XP)`;
  };

  async addCharXP(user, char, xp) {
    const dbChar = await this.getChar(user, char)

    const sql = "UPDATE characters SET xp = $1 WHERE user_id = $3 AND id = $4";

    if (dbChar.xp + xp > 335000) {
      dbChar.xp = 335000;
      await this.query(sql, [dbChar.xp, user.id, char.id])
    } else {
      dbChar.xp += xp;
      await this.query(sql, [dbChar.xp, user.id, char.id])
    }

    return `Successfully added ${xp} XP to Character \"${char.name}\". Character is now Level ${Math.ceil(dbChar.xp/300)-1} (${dbChar.xp} XP)`;
  };

  async remCharXP(user, char, xp) {
    const dbChar = await this.getChar(user, char)

    const sql = "UPDATE characters SET xp = $1 WHERE user_id = $3 AND id = $4";
    if (dbChar.xp - xp < 300) {
      dbChar.xp = 300;
      await this.query(sql, [dbChar.xp, user.id, char.id])
    } else {
      dbChar.xp -= xp;
      await this.query(sql, [dbChar.xp, user.id, char.id])
    }

    return `Successfully removed ${xp} XP from Character \"${char.name}\". Character is now Level ${Math.ceil(dbChar.xp/300)-1} (${dbChar.xp} XP)`;
  };

  async setCharLvl(user, char, lvl) {
    const xp = 300 * (lvl - 1);

    return await this.setCharXP(user, char, xp)
  };

  async selectChar(user, char) {
    const dbChar = await this.getChar(user, char)

    await this.query("UPDATE users SET char_id = $1 WHERE id = $2", [dbChar.id, user.id])

    return `Successfully changed active Character to \"${dbChar.name}\"`;
  };

  async updateCharHP(user, char) {
    const dbChar = await this.getChar(user, char)
    const charClass = await this.getClass({id: dbChar.class})
    const charConstitution = await this.getCharStat(char, "con")
    let hp = charClass.hitdice_size + charConstitution;

    const modifier = dbChar.hp_method === "fixed" ? 0.5 : Math.random()

    if (!dbChar.multi) {
      hp += dbChar.class_level-1 * (Math.ceil(charClass.hitdice_size * modifier) + charConstitution);
    } else {
      await Promise.all(dbChar.mc.map(async (mc) => {
        if (mc.enabled) {
          const charMC = await this.getClass({id: mc.id})

          hp += mc.level-1 * (Math.ceil(charMC.hitdice_size * modifier) + charConstitution);
        }
      }));
    }

    await this.query("UPDATE characters SET hp_max = $1 WHERE user_id = $2 AND id = $3", [hp, user.id, dbChar.id])

    return `Successfully set Maximum HP of Character \"${char.name}\" to ${hp}`;
  };

  async getCharNote(user, char, note) {
    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!")
    }

    if (!note) {
      const results = await this.query("SELECT * FROM character_notes WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Notes found", "Could not find any Notes for this Character in the Database!");
      }

      return results;
    }

    if (note.id) {
      const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND id = $2";
      const results = await this.query(sql, [char.id, note.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Note not found", "Could not find that Character Note in the Database!");
      }

      return results[0];
    }

    const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND title = $2";
    const results = await this.query(sql, [c.id, note.title])

    if (results.length === 0) {
      throw new NotFoundError("Character Note not found", "Could not find a Character Note with that title in the Database!");
    }

    return results[0];
  };

  async charNoteExists(char, note) {
    if (note.id) {
      const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND id = $2";
      const results = await this.query(sql, [char.id, note.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM character_notes WHERE char_id = $1 AND title = $2";
    const results = await this.query(sql, [char.id, note.title])

    return results.length === 1;
  };

  async addCharNote(user, char, note) {
    await this.getCharNote(user, char, note)
    .then(async (charNote) => {
      if (charNote.content == note.content) {
        throw new DuplicateError("Duplicate Character Note", "A Character Note with that title and content already exists in the Database!");
      }

      const sql = "INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)";
      await this.query(sql, [char.id, note.title, note.content, note.private])
    })
    .catch(async (err) => {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)";
      await this.query(sql, [char.id, note.title, note.content, note.private])
    });

    return "Successfully added Character Note to Database";
  };

  async remCharNote(char, note) {
    if (!(await this.charNoteExists(char, note))) {
      throw new NotFoundError("Character Note not found", "Could not find that Character Note in the Database!");
    }

    const sql = "DELETE FROM character_notes WHERE char_id = $1 AND id = $2";
    await this.query(sql, [char.id, note.id])

    return "Successfully removed Character Note from Database";
  };

  async updateCharNote(char, note) {
    if (!(await this.charNoteExists(char, note))) {
      throw new NotFoundError("Character Note not found", "Could not find that Character Note in the Database!");
    }

    const sql = "UPDATE character_notes SET title = $1, content = $2, private = $3 WHERE char_id = $4 AND id = $5";
    await this.query(sql, [note.title, note.content, note.private, char.id, note.id])

    return "Successfully updated Character Note in Database";
  };

  async getCharStat(char, stat) {
    if (!stat) {
      const results = await this.query("SELECT * FROM character_stats WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Stats found", "Could not find any Stats for that Character in the Database!");
      }

      return results;
    }

    const sql = "SELECT * FROM character_stats WHERE char_id = $1 AND key = $2";
    const results = await this.query(sql, [char.id, stat.key])

    if (results.length === 0) {
      throw new NotFoundError("Character Stat not found", "Could not find that Stat for that Character in the Database!");
    }

    return results[0];
  };

  async setCharStats(char, stats) {
    try {
      const charStats = await this.getCharStat(char)
      stats = stats.filter(stat => !stat.key.inlcudes(charStats.map(charStat => charStat.key)))
      
      await Promise.all(stats.map(stat => this.setCharStat(char, stat)));
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
  
      stats.map(async (stat) => {
        await this.setCharStat(char, stat)
      });
    }
  
    return "Successfully added Character Stats to Database";
  };

  async charStatExists(char, stat) {
    const sql = "SELECT * FROM character_stats WHERE char_id = $1 AND key = $2";
    const results = await this.query(sql, [char.id, stat.key])

    return results.length === 1;
  };

  async setCharStat(char, stat) {
    if (!(await this.charStatExists(char, stat))) {
      const sql = "INSERT INTO character_stats (char_id, key, value) VALUES($1, $2, $3)";
      await this.query(sql, [char.id, stat.key, stat.val]);

      return "Successfully added Character Stat to Database";
    }

    const sql = "UPDATE character_stats SET val = $1 WHERE char_id = $2 AND name = $3";
    await this.query(sql, [stat.val, char.id, stat.key])

    return "Successfully updated Character Stat in Database";
  };

  async remCharStat(char, stat) {
    if (!(await this.charStatExists(char, stat))) {
      throw new NotFoundError("Character Stat not found", "Could not find that Character Stat in the Database!")
    }

    const sql = "DELETE FROM character_stats WHERE char_id = $1 AND key = $2";
    await this.query(sql, [char.id, stat.key])

    return "Successfully removed Character Stat from Database";
  };

  async getCharAction(server, user, char, act) {
    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
    }

    if (!act) {
      const results = await this.query("SELECT * FROM character_actions WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Actions found", "Could not find any Actions for that Character in the Database!");
      }

      return Promise.all(results.map(async (action) => {
        if (action.atk_id) {
          const attack = await this.getCharAttack(user, char, {id: action.atk_id})

          const dmgtype = await this.getDamagetype(server, {id: attack.dmg_type_id})

          return {
            id: action.id,
            atk_id: attack.id,
            name: attack.name,
            description: attack.description,
            atk_stat: attack.stat,
            save: attack.save,
            save_stat: attack.save_stat,
            on_fail: attack.on_fail,
            dmg_dice: attack.dmg_dice,
            dmg_dice_size: attack.dmg_dice_size,
            dmg: attack.dmg,
            dmg_type: dmgtype.name,
            magical: attack.magical,
            magic_bonus: attack.magic_bonus
          };
        }

        return {
          id: action.id,
          name: action.name,
          description: action.description,
          type: action.type
        };
      }));
    }

    if (act.id) {
      const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND id = $2";
      const results = await this.query(sql, [char.id, act.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
      }

      const action = results[0];

      if (action.atk_id) {
        const attack = await this.getCharAttack(user, char, {id: action.atk_id})

        const dmgtype = await this.getDamagetype(server, {id: attack.dmg_type_id})

        return {
          id: action.id,
          atk_id: attack.id,
          name: attack.name,
          description: attack.description,
          atk_stat: attack.stat,
          save: attack.save,
          save_stat: attack.save_stat,
          on_fail: attack.on_fail,
          dmg_dice: attack.dmg_dice,
          dmg_dice_size: attack.dmg_dice_size,
          dmg: attack.dmg,
          dmg_type: dmgtype.name,
          magical: attack.magical,
          magic_bonus: attack.magic_bonus
        };
      }

      return {
        id: action.id,
        name: action.name,
        description: action.description,
        type: action.type
      };
    }

    const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND name = $2";
    const results = await this.query(sql, [char.id, act.name])

    if (results.length === 0) {
      throw new NotFoundError("Character Action not found", "Could not find a Character Action with that name in the Database!");
    }

    const action = results[0];

    if (action.atk_id) {
      const attack = await this.getCharAttack(user, char, {id: action.atk_id})

      const dmgtype = await this.getDamagetype(server, {id: attack.dmg_type_id})

      return {
        id: action.id,
        atk_id: attack.id,
        name: attack.name,
        description: attack.description,
        atk_stat: attack.stat,
        save: attack.save,
        save_stat: attack.save_stat,
        on_fail: attack.on_fail,
        dmg_dice: attack.dmg_dice,
        dmg_dice_size: attack.dmg_dice_size,
        dmg: attack.dmg,
        dmg_type: dmgtype.name,
        magical: attack.magical,
        magic_bonus: attack.magic_bonus
      };
    }

    return {
      id: action.id,
      name: action.name,
      description: action.description,
      type: action.type
    };
  };

  async charActionExists(char, act) {
    if (act.id) {
      const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND id = $2";
      const results = await this.query(sql, [char.id, act.id])

      return results.length === 1;
    }

    const sql = "SELECT * FROM character_actions WHERE char_id = $1 AND name = $2";
    const results = await this.query(sql, [char.id, act.name])

    return results.length === 1;
  };

  async addCharAction(char, act) {
    if (await this.charActionExists(char, act)) {
      throw new DuplicateError("Duplicate Character Action", "A Character Action with that name already exists in the Database!");
    }

    const sql = "INSERT INTO character_actions (char_id, name, description, type, atk_id) VALUES($1, $2; $3, $4, $5)";
    await this.query(sql, [char.id, act.name, act.description, act.type, act.atk_id])

    return "Successfully added Character Action into Database";
  };

  async remCharAction(char, act) {
    if (!(await this.charActionExists(char, act))) {
      throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
    }

    const sql = "DELETE FROM character_actions WHERE char_id = $1 AND id = $2";
    await this.query(sql, [char.id, act.id])

    return "Successfully removed Character Action from Database";
  };

  async updateCharAction(char, act) {
    if (!(await this.charActionExists(char, act))) {
      throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
    }

    const sql = "UPDATE character_actions SET name = $1, description = $2, type = $3 WHERE char_id = $4 AND id = $5";
    await this.query(sql, [act.name, act.description, act.type, char.id, act.id])

    return "Successfully updated Character Action in Database";
  };

  async getCharAttack(user, char, atk) {
    if (!(await this.charExists(user, char))) {
      throw new NotFoundError("Character not found", "Could not find that Character in the Database!");
    }

    if (!atk) {
      const results = await this.query("SELECT * FROM character_attacks WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Attacks found", "Could not find any Attacks for that Character in the Database!");
      }

      return results;
    }

    if (atk.id) {
      const sql = "SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2";
      const results = await this.query(sql, [char.id, atk.id])

      if (results.length === 0) {
        throw new NotFoundError("Attack not found", "Could not find that Attack for that Character in the Database!");
      }

      return results[0];
    }

    const sql = "SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2";
    const results = await this.query(sql, [char.id, atk.name])

    if (results.length === 0) {
      throw new NotFoundError("Attack not found", "Could not find an Attack with that name in the Database!");
    }

    return results[0];
  };

  async charAtkExists(char, atk) {
    if (atk.id) {
      const results = await this.query("SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2", [char.id, atk.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2", [char.id, atk.name])

    return results.length === 1;
  };

  async addCharAttack(char, atk) {
    if (await this.charAtkExists(char, atk)) {
      throw new DuplicateError("Duplicate Attack", "An Attack with that name already exists for that Character!");
    }

    const sql = "INSERT INTO character_attacks (char_id, name, description, atk_stat, save, save_stat, on_fail, dmg_dice, dmg_dice_size, dmg, dmg_type_id, magical, magic_bonus) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)";
    await this.query(sql, [char.id, atk.name, atk.description, atk.atk_stat, atk.save, atk.on_fail, atk.dmg_dice, atk.dmg_dice_size, atk.dmg, atk.dmg_type_id, atk.magical, atk.magic_bonus])

    return "Successfully added Attack to Character in Database";
  };

  async remCharAttack(char, atk) {
    if (!(await this.charAtkExists(char, atk))) {
      throw new NotFoundError("Attack not found", "Could not find that Attack for that Character in the Database!");
    }

    await this.query("DELETE FROM character_attacks WHERE char_id = $1 AND id = $2", [char.id, atk.id])

    return "Successfully removed Attack from Character in Database";
  };

  async getCharFeat(server, char, feat) {
    if (!feat) {
      const results = await this.query("SELECT * FROM character_feats WHERE char_id = $1", [char.id])
  
      if (results.length === 0) {
        throw new NotFoundError("No Character Feats found", "Could not find any Feats for that Character in the Database!");
      }
  
      return Promise.all(results.map(async (charFeat) => {
        const dbFeat = await this.getFeat(server, {id: charFeat.feat_id})
  
        return {
          id: charFeat.id,
          name: dbFeat.name,
          description: dbFeat.description,
          feat_id: dbFeat.id
        };
      }));
    }
  
    if (feat.id) {
      const results = await this.query("SELECT * FROM character_feats WHERE char_id = $1 AND id = $2", [char.id, feat.id])
  
      if (results.length === 0) {
        throw new NotFoundError("Character Feat not found", "Could not find that Feat for that Character in the Database!");
      }
  
      const charFeat = results[0];
      const dbFeat = await this.getFeat(server, {id: charFeat.feat_id})
  
      return {
        id: charFeat.id,
        name: dbFeat.name,
        description: dbFeat.description,
        feat_id: dbFeat.id
      };
    }
  
    const dbFeat = await this.getFeat(server, feat)
    const results = await this.query("SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2", [char.id, dbFeat.id])
  
    if (results.length === 0) {
      throw new NotFoundError("Character Feat not found", "Could not find that Feat for that Character in the Database!");
    }
  
    const charFeat = results[0];
  
    return {
      id: charFeat.id,
      name: dbFeat.name,
      description: dbFeat.description,
      feat_id: dbFeat.id
    };
  };

  async charFeatExists(server, char, feat) {
    if (feat.id) {
      const results = await this.query("SELECT * FROM character_feats WHERE char_id = $1 AND id = $2", [char.id, feat.id])

      return results.length === 1;
    }

    return await this.featExists(server, feat)
  };

  async addCharFeat(server, char, feat) {
    if (await this.charFeatExists(server, char, feat)) {
      throw new DuplicateError("Duplicate Character Feat", "That Feat is already linked to that Character!");
    }
  
    const sql = "INSERT INTO character_feats (char_id, feat_id) VALUES ($1, $2)";
  
    if (feat.feat_id) {
      await this.query(sql, [char.id, feat.feat_id])
    }
  
    const dbFeat = await this.getFeat(server, {name: feat.name})
    .catch(() => { throw new BadRequestError("Invalid Feat", "That Feat does not exist in the Database!") });
  
    await this.query(sql, [char.id, dbFeat.id])

    return "Successfully added Feat to Character";
  };

  async remCharFeat(server, char, feat) {
    if (!(await this.charFeatExists(server, char, feat))) {
      throw new NotFoundError("Character Feat not found", "Could not find that Feat for that Character in the Database!");
    }

    const sql = "DELETE FROM character_feats WHERE char_id = $1 AND id = $2";
    await this.query(sql, [char.id, feat.id])

    return "Successfully removed Feat from Character";
  };

  async getCharProficiency(char, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Proficiencies found", "Could not find any Proficiencies for that Character in the Database!");
      }

      return Promise.all(results.map(async (charProf) => {
        const dbProf = await this.getProficiency({id: charProf.type})

        return {
          id: charProf.id,
          char_id: char.id,
          name: charProf.name,
          type: dbProf.name,
          expert: charProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Proficiency not found", "Could not find that Proficiency for that Character in the Database!");
      }

      const charProf = results[0];

      const dbProf = await this.getProficiency({id: charProf.type})

      return {
        id: charProf.id,
        char_id: char.id,
        name: charProf.name,
        type: dbProf.name,
        expert: charProf.expert
      };
    }

    if (prof.type) {
      const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND type = $2", [char.id, prof.type])

      if (results.length === 0) {
        throw new NotFoundError("Character Proficiencies not found", "Could not find any Proficiencies of that type for that Character in the Database!");
      }

      const dbProf = await this.getProficiency({id: prof.type})

      return results.map(charProf => {
        return {
          id: charProf.id,
          char_id: char.id,
          name: charProf.name,
          type: dbProf.name,
          expert: charProf.expert
        };
      });
    }

    const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2", [char.id, prof.name])

    if (results.length === 0) {
      throw new NotFoundError("Character Proficiency not found", "Could not find a Character Proficiency with that name in the Database!");
    }

    const charProf = results[0];

    const dbProf = await this.getProficiency({id: charProf.type})

    return {
      id: charProf.id,
      char_id: char.id,
      name: charProf.name,
      type: dbProf.name,
      expert: charProf.expert
    };
  };

  async charProfExists(char, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2", [char.id, prof.name])

    return results.length === 1;
  };

  async addCharProficiency(char, prof) {
    try {
      const charProf = await this.getCharProficiency(char, prof)

      if (charProf.expert == prof.expert) {
        throw new DuplicateError("Duplicate Character Proficiency", "That Character already has that Proficiency!");
      }

      const sql = "UPDATE character_proficiencies SET expert = $1 WHERE char_id = $2 AND id = $3";
      await this.query(sql, [prof.expert, char.id, charProf.id])

      return "Successfully updated Character Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO character_proficiencies (char_id, name, type, expert) VALUES($1, $2, $3, $4)";
      await this.query(sql, [char.id, prof.name, prof.type, prof.expert])

      return "Successfully added Character Proficiency to Database";
    }
  };

  async remCharProficiency(char, prof) {
    if (!(await this.charProfExists(char, prof))) {
      throw new NotFoundError("Character Proficiency not found", "Could not find that Proficiency for that Character in the Database!");
    }

    await this.query("DELETE FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

    return "Successfully removed Character Proficiency from Database";
  };

  async getCondition(server, condition) {
    if (!condition) {
      const results = await this.query("SELECT * FROM conditions WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No conditions found", "Could not find any Conditions in the Database!");
      }

      return results;
    }

    if (condition.id) {
      const results = await this.query("SELECT * FROM conditions WHERE server_id = $1 AND id = $2", [server.id, condition.id])

      if (results.length === 0) {
        throw new NotFoundError("Condition not found", "Could not find that Condition in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM conditions WHERE server_id = $1 AND name = $2", [server.id, condition.name])

    if (results.length === 0) {
      throw new NotFoundError("Condition not found", "Could not find a Condition with that name in the Database!");
    }

    return results[0];
  };

  async conditionExists(server, condition) {
    if (condition.id) {
      const results = await this.query("SELECT * FROM conditions WHERE server_id = $1 AND id = $2", [server.id, condition.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM conditions WHERE server_id = $1 AND name = $2", [server.id, condition.name])

    return results.length === 1;
  };

  async addCondition(server, condition) {
    if (await this.conditionExists(server, condition)) {
      throw new DuplicateError("Duplicate Condition", "That Condition already exists in the Database!");
    }

    await this.query("INSERT INTO conditions (server_id, name) VALUES($1, $2)", [server.id, condition.name])

    return "Successfully added Condition to Database";
  };

  async remCondition(server, condition) {
    if (!(await this.conditionExists(server, condition))) {
      throw new NotFoundError("Condition not found", "Could not find that Condition in the Database!");
    }

    await this.query("DELETE FROM conditions WHERE server_id = $1 AND id = $2", [server.id, condition.id])

    return "Successfully removed Condition from Database";
  };

  async updateCondition(server, condition) {
    if (!(await this.conditionExists(server, condition))) {
      throw new NotFoundError("Condition not found", "Could not find that Condition in the Database!");
    }

    await this.query("UPDATE conditions SET name = $1 WHERE server_id = $2 AND id = $3", [condition.name, server.id, condition.id])

    return "Successfully updated Condition in Database";
  };

  async getDamagetype(server, dmgtype) {
    if (!dmgtype) {
      const results = await this.query("SELECT * FROM damagetypes WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No Damagetypes found", "Could not find any Damagetypes in the Database!");
      }

      return results;
    }

    if (dmgtype.id) {
      const results = await this.query("SELECT * FROM damagetypes WHERE server_id = $1 AND id = $2", [server.id, dmgtype.id])

      if (results.length === 0) {
        throw new NotFoundError("Damagetype not found", "Could not find that Damagetype in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM damagetypes WHERE server_id = $1 AND name = $2", [server.id, dmgtype.name])

    if (results.length === 0) {
      throw new NotFoundError("Damagetype not found", "Could not find a Damagetype with that name in the Database!");
    }

    return results[0];
  };

  async dmgtypeExists(server, dmgtype) {
    if (dmgtype.id) {
      const results = await this.query("SELECT * FROM damagetypes WHERE server_id = $1 AND id = $2", [server.id, dmgtype.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM damagetypes WHERE server_id = $1 AND name = $2", [server.id, dmgtype.name])

    return results.length === 1;
  };

  async addDamagetype(server, dmgtype) {
    if (await this.dmgtypeExists(server, dmgtype)) {
      throw new DuplicateError("Duplicate Damagetype", "That Damagetype already exists in the Database!");
    }

    await this.query("INSERT INTO damagetypes (server_id, name) VALUES($1, $2)", [server.id, dmgtype.name])

    return "Successfully added Damagetype to Database";
  };

  async remDamagetype(server, dmgtype) {
    if (!(await this.dmgtypeExists(server, dmgtype))) {
      throw new NotFoundError("Damagetype not found", "Could not find that Damagetype in the Database!");
    }

    await this.query("DELETE FROM damagetypes WHERE server_id = $1 AND id = $2", [server.id, dmgtype.id])

    return "Successfully removed Damagetype from Database";
  };

  async updateDamagetype(server, dmgtype) {
    if (!(await this.dmgtypeExists(server, dmgtype))) {
      throw new NotFoundError("Damagetype not found", "Could not find that Damagetype in the Database!");
    }

    await this.query("UPDATE damagetypes SET name = $1 WHERE server_id = $2 AND id = $3", [dmgtype.name, server.id, dmgtype.id])

    return "Successfully updated Damagetype in Database";
  };

  async getCharResistance(server, char, resistance) {
    if (!resistance) {
      const results = await this.query("SELECT * FROM character_resistances WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Resistances found", "Could not find any Resistances for that Character in the Database!");
      }

      return Promise.all(results.map(async (charResist) => {
        let dbResist;

        switch (charResist.type) {
          case "damagetype":
            dbResist = await this.getDamagetype(server, {id: charResist.res_id})
          break;
          case "condition":
            dbResist = await this.getCondition(server, {id: charResist.res_id})
          break;
        }

        return {
          id: charResist.id,
          name: dbResist.name,
          type: charResist.type,
          name: dbResist.name,
          res_id: dbResist.id
        };
      }));
    }

    if (resistance.id) {
      const results = await this.query("SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2", [char.id, resistance.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Resistance not found", "Could not find that Resistance for that Character in the Database!");
      }

      const charResist = results[0];
      let dbResist;

      switch (charResist.type) {
        case "damagetype":
          dbResist = await this.getDamagetype(server, {id: charResist.res_id})
        break;
        case "condition":
          dbResist = await this.getCondition(server, {id: charResist.res_id})
        break;
      }

      return {
        id: charResist.id,
        name: dbResist.name,
        type: charResist.type,
        name: dbResist.name,
        res_id: dbResist.id
      };
    }

    let dbResist;

    switch (resistance.type) {
      case "damagetype":
        dbResist = await this.getDamagetype(server, {name: resistance.name})
      break;
      case "condition":
        dbResist = await this.getCondition(server, {name: resistance.name})
      break;
    }

    const results = await this.query("SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2", [char.id, dbResist.id])

    if (results.length === 0) {
      throw new NotFoundError("Character Resistance not found", "Could not find a Resistance with that name for that Character in the Database!");
    }

    const charResist = results[0];

    return {
      id: charResist.id,
      name: dbResist.name,
      type: charResist.type,
      name: dbResist.name,
      res_id: dbResist.id
    };
  };

  async charResistExists(server, char, resistance) {
    if (resistance.id) {
      const results = await this.query("SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2", [char.id, resistance.id])

      return results.length === 1;
    }

    let dbResist;

    switch (resistance.type) {
      case "damagetype":
        dbResist = await this.getDamagetype(server, {name: resistance.name})
      break;
      case "condition":
        dbResist = await this.getCondition(server, {name: resistance.name})
      break;
    }

    const results = await this.query("SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2", [char.id, dbResist.id])

    return results.length === 1;
  };

  async addCharResistance(server, char, resistance) {
    if (await this.charResistExists(server, char, resistance)) {
      throw new DuplicateError("Duplicate Character Resistance", "That Resistance is already linked to that Character!");
    }

    const sql = "INSERT INTO character_resistances (char_id, type, res_id) VALUES($1, $2, $3)";
    await this.query(sql, [char.id, resistance.type, dbResist.id])

    return "Successfully added Resistance to Character in Database";
  };

  async remCharReistance(server, char, resistance) {
    if (!(await this.charResistExists(server, char, resistance))) {
      throw new NotFoundError("Character Resistance not found", "Could not find that Resistance for that Character in the Database!");
    }

    const sql = "DELETE FROM character_resistances WHERE char_id = $1 AND id = $2";
    await this.query(sql, [char.id, resistance.id])

    return "Successfully removed Resistance from Character in Database";
  };

  async getCharImmunity(server, char, immunity) {
    if (!immunity) {
      const results = await this.query("SELECT * FROM character_immunities WHERE char_id = $1", [char.id])
  
      if (results.length === 0) {
        throw new NotFoundError("No Character Immunities found", "Could not find any Immunities for that Character in the Database!");
      }
  
      return Promise.all(results.map(async (charImmune) => {
        let dbImmune;
  
        switch (charImmune.type) {
          case "damagetype":
            dbImmune = await this.getDamagetype(server, {id: charImmune.imm_id})
          break;
          case "condition":
            dbImmune = await this.getCondition(server, {id: charImmune.imm_id})
          break;
        }
  
        return {
          id: charImmune.id,
          name: dbImmune.name,
          type: charImmune.type,
          name: dbImmune.name,
          imm_id: dbImmune.id
        };
      }));
    }
  
    if (immunity.id) {
      const results = await this.query("SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2", [char.id, immunity.id])
  
      if (results.length === 0) {
        throw new NotFoundError("Character Immunity not found", "Could not find that Immunity for that Character in the Database!");
      }
  
      const charImmune = results[0];
      let dbImmune;
  
      switch (charImmune.type) {
        case "damagetype":
          dbImmune = await this.getDamagetype(server, {id: charImmune.imm_id})
        break;
        case "condition":
          dbImmune = await this.getCondition(server, {id: charImmune.imm_id})
        break;
      }
  
      return {
        id: charImmune.id,
        name: dbImmune.name,
        type: charImmune.type,
        name: dbImmune.name,
        imm_id: dbImmune.id
      };
    }
  
    let dbImmune;
  
    switch (immunity.type) {
      case "damagetype":
        dbImmune = await this.getDamagetype(server, {name: immunity.name})
      break;
      case "condition":
        dbImmune = await this.getCondition(server, {name: immunity.name})
      break;
    }
  
    const results = await this.query("SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2", [char.id, dbImmune.id])
  
    if (results.length === 0) {
      throw new NotFoundError("Character Immunity not found", "Could not find an Immunity with that name for that Character in the Database!");
    }
  
    const charImmune = results[0];
  
    return {
      id: charImmune.id,
      name: dbImmune.name,
      type: charImmune.type,
      name: dbImmune.name,
      imm_id: dbImmune.id
    };
  };

  async charImmuneExists(server, char, immunity) {
    if (immunity.id) {
      const results = await this.query("SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2", [char.id, immunity.id])

      return results.length === 1;
    }

    let dbImmune;

    switch (immunity.type) {
      case "damagetype":
        dbImmune = await this.getDamagetype(server, {name: immunity.name})
      break;
      case "condition":
        dbImmune = await this.getCondition(server, {name: immunity.name})
      break;
    }

    const results = await this.query("SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2", [char.id, dbImmune.id])

    return results.length === 1;
  };

  async addCharImmunity(server, char, immunity) {
    if (await this.charImmuneExists(server, char, immunity)) {
      throw new DuplicateError("Duplicate Character Immunity", "That Immunity is already linked to that Character!");
    }

    let dbImmune;

    switch (immunity.type) {
      case "damagetype":
        dbImmune = await this.getDamagetype(server, {name: immunity.name})
      break;
      case "condition":
        dbImmune = await this.getCondition(server, {name: immunity.name})
      break;
    }

    const sql = "INSERT INTO character_immunities (char_id, type, imm_id) VALUES($1, $2, $3)";
    await this.query(sql, [char.id, immunity.type, dbImmune.id])

    return "Successfully added Character Immunity to Database";
  };

  async remCharImmunity(server, char, immunity) {
    if (!(await this.charImmuneExists(server, char, immunity))) {
      throw new NotFoundError("Character Immunity not found", "Could not find that Immunity for that Character in the Database!");
    }

    await this.query("DELETE FROM character_immunities WHERE char_id = $1 AND id = $2", [char.id, immunity.id])

    return "Successfully removed Character Immunity from Database";
  };

  async getCharSense(char, sense) {
    if (!sense) {
      const results = await this.query("SELECT * FROM character_senses WHERE char_id = $1", [char.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Senses found", "Could not find any Senses for that Character in the Database!");
      }

      return results;
    }

    if (sense.id) {
      const results = await this.query("SELECT * FROM character_senses WHERE char_id = $1 AND id = $2", [char.id, sense.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Sense not found", "Could not find that Sense for that Character in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM character_senses WHERE char_id = $1 AND name = $2", [char.id, sense.name])

    if (results.length === 0) {
      throw new NotFoundError("Character Sense not found", "Could not find a Sense with that name for that Character in the Database!");
    }

    return results[0];
  };

  async charSenseExists(char, sense) {
    if (sense.id) {
      const results = await this.query("SELECT * FROM character_senses WHERE char_id = $1 AND id = $2", [char.id, sense.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_senses WHERE char_id = $1 AND name = $2", [char.id, sense.name])

    return results.length === 1;
  };

  async addCharSense(char, sense) {
    try {
      const charSense = await this.getCharSense(char, sense)
  
      if (charSense.range <= sense.range) {
        throw new DuplicateError("Duplicate Character Sense", "That Character already has that Sense with the same or a larger range!");
      }
  
      await this.query("UPDATE character_senses SET range = $1 WHERE char_id = $2 AND name = $3", [sense.range, char.id, sense.name])
  
      return "Successfully updated Character Sense in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
  
      const sql = "INSERT INTO character_senses (char_id, name, range) VALUES($1, $2, $3)";
      await this.query(sql, [char.id, sense.name, sense.range])
  
      return "Successfully added Character Sense to Database";
    }
  };

  async remCharSense(char, sense) {
    if (!(await this.charSenseExists(char, sense))) {
      throw new NotFoundError("Character Sense not found", "Could not find that Sense for that Character in the Database!");
    }

    await this.query("DELETE FROM character_senses WHERE char_id = $1 AND id = $2", [char.id, sense.id])

    return "Successfully removed Character Sense from Database";
  };

  async updateCharSense(char, sense) {
    if (!(await this.charSenseExists(char, sense))) {
      throw new NotFoundError("Character Sense not found", "Could not find that Sense for that Character in the Database!");
    }

    const sql = "UPDATE character_senses SET name = $1, range = $2 WHERE char_id = $3 AND id = $4";
    await this.query(sql, [sense.name, sense.range, char.id, sense.id])

    return "Successfully updated Character Sense in Database";
  };

  async getArmor(server, armor) {
    if (!armor) {
      const results = await this.query("SELECT * FROM armors WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No Armor found", "Could not find any Armor in the Database!");
      }

      return results;
    }

    if (armor.id) {
      const results = await this.query("SELECT * FROM armors WHERE server_id = $1 AND id = $2", [server.id, armor.id])

      if (results.length === 0) {
        throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM armors WHERE server_id = $1 AND name = $2", [server.id, armor.name])

    if (results.length === 0) {
      throw new NotFoundError("Armor not found", "Could not find an Armor with that name in the Database!");
    }

    return results[0];
  };

  async armorExists(server, armor) {
    if (armor.id) {
      const results = await this.query("SELECT * FROM armors WHERE server_id = $1 AND id = $2", [server.id, armor.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM armors WHERE server_id = $1 AND name = $2", [server.id, armor.name])

    return results.length === 1;
  };

  async addArmor(server, armor) {
    if (await this.armorExists(server, armor)) {
      throw new DuplicateError("Duplicate Armor", "That Armor already exists in the Database!");
    }

    const sql = "INSERT INTO armors (server_id, name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    await this.query(sql, [server.id, armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req])

    return "Successfully added Armor to Database";
  };

  async remArmor(server, armor) {
    if (!(await this.armorExists(server, armor))) {
      throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
    }

    await this.query("DELETE FROM armors WHERE server_id = $1 AND id = $2", [server.id, armor.id])

    return "Successfully removed Armor from Database";
  };

  async updateArmor(server, armor) {
    if (!(await this.armorExists(server, armor))) {
      throw new NotFoundError("Armor not found", "Could not find that Armor in the Database!");
    }

    const sql = "UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE server_id = $12 AND id = $13";
    await this.query(sql, [armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune, armor.attune_req, server.id, armor.id])
    
    return "Successfully updated Armor in Database";
  };

  async getFeat(server, feat) {
    if (!feat) {
      const results = await this.query("SELECT * FROM feats WHERE server_id = $1", [server.id])

      if (results.length === 0) {
        throw new NotFoundError("No Feats found", "Could not find any Feats in the Database!");
      }

      return results;
    }

    if (feat.id) {
      const results = await this.query("SELECT * FROM feats WHERE server_id = $1 AND id = $2", [server.id, feat.id])

      if (results.length === 0) {
        throw new NotFoundError("Feat not found", "Could not find that Feat in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM feats WHERE server_id = $1 AND name = $2", [server.id, feat.name])

    if (results.length === 0) {
      throw new NotFoundError("Feat not found", "Could not find a Feat with that name in the Database!");
    }

    return results[0];
  };

  async featExists(server, feat) {
    let results;
  
    if (feat.id) {
      results = await this.query("SELECT * FROM feats WHERE server_id = $1 AND id = $2", [server.id, feat.id])
    } else {
      results = await this.query("SELECT * FROM feats WHERE server_id = $1 AND name = $2", [server.id, feat.name])
    }
  
    return results.length === 1;
  };

  async addFeat(server, feat) {
    if (await this.featExists(server, feat)) {
      throw new DuplicateError("Duplicate Feat", "That Feat already exists in the Database!");
    }

    const sql = "INSERT INTO feats (server_id, name, description, type, val1, val2, val3) VALUES($1, $2, $3, $4, $5, $6, $7)";
    await this.query(sql, [server.id, feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3])

    return "Successfully added Feat to Database";
  };

  async remFeat(server, feat) {
    if (!(await this.featExists(server, feat))) {
      throw new NotFoundError("Feat not found", "Could not find that Feat in the Database!");
    }

    await this.query("DELETE FROM feats WHERE server_id = $1 AND id = $2", [server.id, feat.id])

    return "Successfully removed Feat from Database";
  };

  async updateFeat(server, feat) {
    if (!(await this.featExists(server, feat))) {
      throw new NotFoundError("Feat not found", "Could not find that Feat in the Database!");
    }

    const sql = "UPDATE feats SET name = $1, description = $2, type = $3, val1 = $4, val2 = $5, val3 = $6 WHERE server_id = $7 AND id = $8";
    await this.query(sql, [feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3, server.id, feat.id])

    return "Successfully updated Feat in Database";
  };

  async getSense(sense) {
    if (!sense) {
      const results = await this.query("SELECT * FROM senses")

      if (results.length === 0) {
        throw new NotFoundError("No Senses found", "Could not find any Senses in the Database!");
      }

      return results;
    }

    if (sense.id) {
      const results = await this.query("SELECT * FROM senses WHERE id = $1", [sense.id])

      if (results.length === 0) {
        throw new NotFoundError("Sense not found", "Could not find that Sense in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM senses WHERE name = $1", [sense.name])

    if (results.length === 0) {
      throw new NotFoundError("Sense not found", "Could not find a Sense with that name in the Database!");
    }

    return results[0];
  };

  async senseExists(sense) {
    if (sense.id) {
      const results = await this.query("SELECT * FROM senses WHERE id = $1", [sense.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM senses WHERE name = $1", [sense.name])

    return results.length === 1;
  };

  async addSense(sense) {
    if (await this.senseExists(sense)) {
      throw new DuplicateError("Duplicate Sense", "That Sense already exists in the Database!");
    }

    await this.query("INSERT INTO senses (name) VALUES($1)", [sense.name])

    return "Successfully added Sense to Database";
  };

  async remSense(sense) {
    if (!(await this.senseExists(sense))) {
      throw new NotFoundError("Sense not found", "Could not find that Sense in the Database!");
    }

    await this.query("DELETE FROM senses WHERE id = $1", [sense.id])

    return "Successfully removed Sense from Database";
  };

  async getClass(clas) {
    if (!clas) {
      const results = await this.query("SELECT * FROM classes")

      if (results.length === 0) {
        throw new NotFoundError("No Classes found", "Could not find any Classes in the Database!");
      }

      return Promise.all(results.map(async (dbClass) => {
        const classProfs = await this.getClassProf(clas)
        const classSaves = await this.getClassSave(clas)
        const classSenses = await this.getClassSense(clas)
        const classTraits = await this.getClassTrait(clas)

        return {
          id: dbClass.id,
          name: dbClass.name,
          hitdice: dbClass.hitdice,
          hitdice_size: dbClass.hitdice_size,
          caster: dbClass.caster,
          cast_lvl: dbClass.cast_lvl,
          sub: dbClass.sub,
          profs: classProfs,
          saves: classSaves,
          senses: classSenses,
          traits: classTraits
        };
      }));
    }

    if (clas.id) {
      const results = await this.query("SELECT * FROM classes WHERE id = $1", [clas.id])

      if (results.length === 0) {
        throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
      }

      const dbClass = results[0];

      const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
        this.getClassProf(clas),
        this.getClassSave(clas),
        this.getClassSense(clas),
        this.getClassTrait(clas)
      ]);

      return {
        id: dbClass.id,
        name: dbClass.name,
        hitdice: dbClass.hitdice,
        hitdice_size: dbClass.hitdice_size,
        caster: dbClass.caster,
        cast_lvl: dbClass.cast_lvl,
        sub: dbClass.sub,
        profs: classProfs,
        saves: classSaves,
        senses: classSenses,
        traits: classTraits
      };
    }

    const results = await this.query("SELECT * FROM classes WHERE name = $1", [clas.name])

    if (results.length === 0) {
      throw new NotFoundError("Class not found", "Could not find a Class with that name in the Database!");
    }

    const dbClass = results[0];

    const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
      this.getClassProf(clas),
      this.getClassSave(clas),
      this.getClassSense(clas),
      this.getClassTrait(clas)
    ]);

    return {
      id: dbClass.id,
      name: dbClass.name,
      description: dbClass.description,
      hitdice: dbClass.hitdice,
      hitdice_size: dbClass.hitdice_size,
      caster: dbClass.caster,
      cast_lvl: dbClass.cast_lvl,
      sub: dbClass.sub,
      profs: classProfs,
      saves: classSaves,
      senses: classSenses,
      traits: classTraits
    };
  };

  async classExists(clas) {
    if (clas.id) {
      const results = await this.query("SELECT * FROM classes WHERE server_id = $1 AND id = $2", [server.id, clas.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM classes WHERE server_id = $1 AND name = $2", [server.id, clas.name])

    return results.length === 1;
  };

  async addClass(clas) {
    if (await this.classExists(clas)) {
      throw new DuplicateError("Duplicate Class", "That Class already exists in the Database!");
    }

    const sql = "INSERT INTO classes (name, description, hitdice, hitdice_size, caster, cast_lvl, sub) VALUES($1, $2, $3, $4, $5, $6, $7. $8)";
    await this.query(sql, [clas.name, clas.description, clas.hitdice, clas.hitdice_size, clas.caster, clas.cast_lvl, clas.sub])

    return "Successfully added Class to Database";
  };

  async remClass(clas) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    await this.query("DELETE FROM classes WHERE id = $1", [clas.id])

    return "Successfully removed Class from Database";
  };

  async updateClass(clas) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    const sql = "UPDATE classes SET name = $1, description = $2, hitdice = $3, hitdice_size = $4, caster = $5, cast_lvl = $6, sub = $7 WHERE id = $8";
    await this.query(sql, [clas.name, clas.description, clas.hitdice, clas.hitdice_size, clas.caster, clas.cast_lvl, clas.sub, clas.id])

    return "Successfully updated Class in Database";
  };

  async getClassTrait(clas, trait) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    if (!trait) {
      const results = await this.query("SELECT * FROM class_traits WHERE class_id = $1", [clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Class Traits found", "Could not find any Traits for that Class in the Database!");
      }

      return results;
    }

    if (trait.id) {
      const results = await this.query("SELECT * FROM class_traits WHERE class_id = $1 AND id = $2", [clas.id, trait.id])

      if (results.length === 0) {
        throw new NotFoundError("Class Trait not found", "Could not find that Trait for that Class in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM class_traits WHERE class_id = $1 AND name = $2", [clas.id, trait.name])

    if (results.length === 0) {
      throw new NotFoundError("Class Trait not found", "Could not find a Trait with that name for that Class in the Database!");
    }

    return results[0];
  };

  async classTraitExists(clas, trait) {
    if (trait.id) {
      const results = await this.query("SELECT * FROM class_traits WHERE class_id = $1 AND id = $2", [clas.id, trait.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM class_traits WHERE class_id = $1 AND name = $2", [clas.id, trait.name])
    
    return results.length === 1;
  };

  async addClassTrait(clas, trait) {
    if (await this.classTraitExists(clas, trait)) {
      throw new DuplicateError("Duplicate Class Trait", "That Class already has that trait!");
    }

    const sql = "INSERT INTO class_traits (class_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    await this.query(sql, [clas.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])
    
    return "Successfully added Class Trait to Database";
  };

  async remClassTrait(clas, trait) {
    if (!(await this.classTraitExists(clas, trait))) {
      throw new NotFoundError("Class Trait not found", "Could not find that Trait for that Class in the Database!");
    }

    await this.query("DELETE FROM class_traits WHERE class_id = $1 AND id = $2", [clas.id, trait.id])

    return "Successfully removed Class Trait from Database";
  };

  async updateClassTrait(clas, trait) {
    if (!(await this.classTraitExists(clas, trait))) {
      throw new NotFoundError("Class Trait not found", "Could not find that Trait for that Class in the Database!");
    }

    const sql = "UPDATE class_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE class_id = $12 AND id = $13";
    await this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, clas.id, trait.id])

    return "Successfully updated Class Trait in Database";
  };

  async getCharClassFeat(char, clas, feat) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    if (!feat) {
      const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2", [char.id, clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character (class-only) Feats found", "Could not find any Feats granted by the Character\'s Class in the Database!")
      }

      return Promise.all(results.map(async (charFeat) => {
        const dbFeat = await this.getFeat({id: charFeat.feat_id})

        return {
          id: charFeat.id,
          char_id: char.id,
          class_id: clas.id,
          feat_id: dbFeat.id,
          name: dbFeat.name,
          description: dbFeat.description,
          visible: dbFeat.visible
        };
      }));
    }

    if (feat.feat_id) {
      const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3", [char.id, clas.id, feat.feat_id])

      if (results.length === 0) {
        throw new NotFoundError("Character (class-only) Feat not found", "Could not find that Feat granted by that Class for that Character in the Database!");
      }

      const charFeat = results[0];

      const dbFeat = await this.getFeat(server, {id: feat.feat_id})

      return {
        id: charFeat.id,
        char_id: char.id,
        class_id: clas.id,
        feat_id: dbFeat.id,
        name: dbFeat.name,
        description: dbFeat.description,
        visible: dbFeat.visible
      };
    }

    if (feat.id) {
      const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, feat.id])

      if (results.length === 0) {
        throw new NotFoundError("Character (class-only) Feat not found", "Could not find that Feat granted by that Class for that Character in the Database!");
      }

      const charFeat = results[0];

      const dbFeat = await this.getFeat(server, {id: charFeat.feat_id})

      return {
        id: charFeat.id,
        char_id: char.id,
        class_id: clas.id,
        feat_id: dbFeat.id,
        name: dbFeat.name,
        description: dbFeat.description,
        visible: dbFeat.visible
      };
    }

    const dbFeat = await this.getFeat(server, {name: feat.name})

    const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3", [char.id, clas.id, dbFeat.id])

    if (results.length === 0) {
      throw new NotFoundError("Character (class-only) Feat not found", "Could not find a Feat granted by that Class with that name for that Character in the Database!");
    }

    const charFeat = results[0];

    return {
      id: charFeat.id,
      char_id: char.id,
      class_id: clas.id,
      feat_id: dbFeat.id,
      name: dbFeat.name,
      description: dbFeat.description,
      visible: dbFeat.visible
    };
  };

  async charClassFeatExists(char, clas, feat) {
    if (feat.id) {
      const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, feat.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3", [char.id, clas.id, feat.feat_id])

    return results.length === 1;
  };

  async addCharClassFeat(char, clas, feat) {
    if (await this.charClassFeatExists(char, clas, feat)) {
      throw new DuplicateError("Duplicate Character (class-only) Feat", "That Character already has that Feat granted by that Class!");
    }

    const sql = "INSERT INTO character_class_feats (char_id, class_id, feat_id) VALUES($1, $2, $3)";
    await this.query(sql, [char.id, clas.id, feat.id])

    return "Successfully added Character (class-only) Feat to Database";
  };

  async remCharClassFeat(char, clas, feat) {
    if (!(await this.charClassFeatExists(char, clas, feat))) {
      throw new NotFoundError("Character (class-only) Feat not found", "Could not find that Feat granted by that Class for that Character in the Database!");
    }

    await this.query("DELETE FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, feat.id])

    return "Successfully removed Character (class-only) Feat from Database";
  };

  async getCharClassProf(char, clas, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2", [char.id, clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character (class-only) Proficiencies found", "Could not find any Proficiencies granted by that Class for that Character in the Database!");
      }

      return Promise.all(results.map(async (charProf) => {
        const dbProf = this.getProficiency({id: charProf.type})

        return {
          id: charProf.id,
          char_id: char.id,
          class_id: clas.id,
          name: charProf.name,
          type: dbProf.name,
          expert: charProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Character (class-only) Proficiency not found", "Could not find that Proficiency granted by that Class for that Character in the Database!");
      }

      const charProf = results[0];

      const dbProf = await this.getProficiency({id: charProf.type})

      return {
        id: charProf.id,
        char_id: char.id,
        class_id: clas.id,
        name: charProf.name,
        type: dbProf.name,
        expert: charProf.expert
      };
    }

    const results = await this.query("SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3", [char.id, clas.id, prof.name])

    if (results.length === 0) {
      throw new NotFoundError("Character (class-only) Proficiency not found", "Could not find a Proficiency granted by that Class with that name for that Character in the Database!");
    }

    const charProf = results[0];

    const dbProf = await this.getProficiency({id: charProf.type})

    return {
      id: charProf.id,
      char_id: char.id,
      class_id: clas.id,
      name: charProf.name,
      type: dbProf.name,
      expert: charProf.expert
    };
  };

  async charClassProfExists(char, clas, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3", [char.id, clas.id, prof.name])

    return results.length === 1;
  };

  async addCharClassProf(char, clas, prof) {
    if (await this.charClassProfExists(char, clas, prof)) {
      throw new DuplicateError("Duplicate Character (class-only) Proficiency", "That Character already has that Proficiency granted by that Class!");
    }

    const sql = "INSERT INTO character_class_profs (char_id, class_id, name, type, expert) VALUES($1, $2, $3, $4, $5)";
    await this.query(sql, [char.id, clas.id, prof.name, prof.type, prof.expert])

    return "Successfully added Character (class-only) Proficiency to Database";
  };

  async remCharClassProf(char, clas, prof) {
    if (!(await this.charClassProfExists(char, clas, prof))) {
      throw new NotFoundError("Character (class-only) Proficiency not found", "Could not find that Proficiency granted by that Class for that Character in the Database!");
    }

    await this.query("DELETE FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3", [char.id, clas.id, prof.id])

    return "Successfully removed Character (class-only) Proficiency from Database";
  };

  async updateCharClassProf(char, clas, prof) {
    if (!(await this.charClassProfExists(char, clas, prof))) {
      throw new NotFoundError("Character (class-only) Proficiency not found", "Could not find that Proficiency granted by that Class for that Character in the Database!");
    }

    const sql = "UPDATE character_class_profs SET name = $1, expert = $2 WHERE char_id = $3 AND class_id = $4 AND id = $5";
    await this.query(sql, [prof.name, prof.expert, char.id, clas.id, prof.id])

    return "Successfully updated Character (class-only) Proficiency in Database";
  };

  async getClassSave(clas, save) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    if (!save) {
      const results = await this.query("SELECT * FROM class_saves WHERE class_id = $1", [clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Class Saves found", "Could not find any Saves for that Class in the Database!");
      }

      return results;
    }

    if (save.id) {
      const results = await this.query("SELECT * FROM class_saves WHERE class_id = $1 AND id = $2", [clas.id, save.id])

      if (results.length === 0) {
        throw new NotFoundError("Class Save not found", "Could not find that Save for that Class in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2", [clas.id, save.stat])

    if (results.length === 0) {
      throw new NotFoundError("Class Save not found", "That Class does not have a Save for that Stat!");
    }

    return results[0];
  };

  async classSaveExists(clas, save) {
    if (save.id) {
      const results = await this.query("SELECT * FROM class_saves WHERE class_id = $1 AND id = $2", [clas.id, save.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2", [clas.id, save.stat])

    return results.length === 1;
  };

  async addClassSave(clas, save) {
    if (await this.classSaveExists(clas, save)) {
      throw new DuplicateError("Duplicate Class Save", "That Class already has a Save for that Stat in the Database!");
    }

    const sql = "INSERT INTO class_saves (class_id, stat, level) VALUES($1, $2, $3)";
    await this.query(sql, [clas.id, save.stat, save.level])

    return "Successfully added Class Save to Database";
  };

  async remClassSave(clas, save) {
    if (!(await this.classSaveExists(clas, save))) {
      throw new NotFoundError("Class Save not found", "Could not find that Save for that Class in the Database!");
    }

    await this.query("DELETE FROM class_saves WHERE class_id = $1 AND id = $2", [clas.id, save.id])

    return "Successfully removed Class Save from Database";
  };

  async updateClassSave(clas, save) {
    if (!(await this.classSaveExists(clas, save))) {
      throw new NotFoundError("Class Save not found", "Could not find that Save for that Class in the Database!");
    }

    const sql = "UPDATE class_saves SET stat = $1, level = $2 WHERE class_id = $3 AND id = $4";
    await this.query(sql, [save.stat, save.level, clas.id, save.id])

    return "Successfully updated Class Save in Database";
  };

  async getClassSense(clas, sense) {
    if (!(await this.classExists(clas))) {
      throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
    }

    if (!sense) {
      const results = await this.query("SELECT * FROM class_senses WHERE class_id = $1", [clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Class Senses found", "Could not find any Senses for that Class in the Database!");
      }

      return Promise.all(results.map(async (classSense) => {
        const dbSense = await this.getSense({id: classSense.sense_id})

        return {
          id: classSense.id,
          class_id: clas.id,
          name: dbSense.name,
          range: classSense.range
        };
      }));
    }

    if (sense.id) {
      const results = await this.query("SELECT * FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])

      if (results.length === 0) {
        throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
      }

      const classSense = results[0];

      const dbSense = await this.getSense({id: classSense.sense_id})

      return {
        id: classSense.id,
        class_id: clas.id,
        name: dbSense.name,
        range: classSense.range
      };
    }

    const results = await this.query("SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2", [clas.id, sense.sense_id])

    if (results.length === 0) {
      throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
    }

    const classSense = results[0];

    const dbSense = await this.getSense({id: classSense.sense_id})

    return {
      id: classSense.id,
      class_id: clas.id,
      name: dbSense.name,
      range: classSense.range
    };
  };

  async classSenseExists(clas, sense) {
    if (sense.id) {
      const results = await this.query("SELECT * FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2", [clas.id, sense.sense_id])

    return results.length === 1;
  };

  async addClassSense(clas, sense) {
    if (await this.classSenseExists(clas, sense)) {
      throw new DuplicateError("Duplicate Class Sense", "That Class already has that Sense in the Database!");
    }

    const sql = "INSERT INTO class_senses (class_id, sense_id, range) VALUES($1, $2, $3)";
    await this.query(sql, [clas.id, sense.sense_id, sense.range])

    return "Successfully added Class Sense to Database";
  };

  async remClassSense(clas, sense) {
    if (!(await this.classSenseExists(clas, sense))) {
      throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
    }

    await this.query("DELETE FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])

    return "Successfully removed Class Sense from Database";
  };

  async updateClassSense(clas, sense) {
    if (!(await this.classSaveExists(clas, sense))) {
      throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
    }

    await this.query("UPDATE class_senses SET range = $1 WHERE class_id = $2 AND id = $3", [sense.range, clas.id, sense.id])

    return "Successfully updated Class Saves in Database";
  };

  async classHasSub(clas) {
    if (clas.id) {
      const results = await this.query("SELECT * FROM classes WHERE id = $1", [clas.id])

      return results[0].sub;
    }

    const results = await this.query("SELECT * FROM classes WHERE name = $2", [clas.name])

    return results[0].sub;
  };

  async getSubclass(clas, sub) {
    if (!(await this.classHasSub(clas))) {
      throw new BadRequestError("Invalid Request", "This Class does not have Subclasses enabled!");
    }

    if (!sub) {
      const results = await this.query("SELECT * FROM subclasses WHERE class_id = $1", [clas.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subclasses found", "Could not find any Subclasses for that Class in the Database!");
      }

      return Promise.all(results.map(async (dbSub) => {
        const [subProfs, subSenses, subTraits] = await Promise.all([
          this.getSubclassProf(sub),
          this.getSubclassSense(sub),
          this.getSubclassTrait(sub)
        ]);

        return {
          id: dbSub.id,
          class_id: clas.id,
          name: dbSub.name,
          description: dbSub.description,
          caster: dbSub.caster,
          cast_lvl: dbSub.cast_lvl,
          profs: subProfs,
          senses: subSenses,
          traits: subTraits
        };
      }));
    }

    if (sub.id) {
      const results = await this.query("SELECT * FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])

      if (results.length === 0) {
        throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
      }

      const dbSub = results[0];

      const [subProfs, subSenses, subTraits] = await Promise.all([
        this.getSubclassProf(sub),
        this.getSubclassSense(sub),
        this.getSubclassTrait(sub)
      ]);

      return {
        id: dbSub.id,
        class_id: clas.id,
        name: dbSub.name,
        description: dbSub.description,
        caster: dbSub.caster,
        cast_lvl: dbSub.cast_lvl,
        profs: subProfs,
        senses: subSenses,
        traits: subTraits
      };
    }

    const results = await this.query("SELECT * FROM subclasses WHERE class_id = $1 AND name = $2", [clas.id, sub.name])

    if (results.length === 0) {
      throw new NotFoundError("Subclass not found", "Could not find a Subclass with that name in the Database!");
    }

    const dbSub = results[0];

    const [subProfs, subSenses, subTraits] = await Promise.all([
      this.getSubclassProf(sub),
      this.getSubclassSense(sub),
      this.getSubclassTrait(sub)
    ]);

    return {
      id: dbSub.id,
      class_id: clas.id,
      name: dbSub.name,
      description: dbSub.description,
      caster: dbSub.caster,
      cast_lvl: dbSub.cast_lvl,
      profs: subProfs,
      senses: subSenses,
      traits: subTraits
    };
  };

  async subclassExists(clas, sub) {
    if (sub.id) {
      const results = await this.query("SELECT * FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM subclasses WHERE class_id = $1 AND name = $2", [clas.id, sub.name])

    return results.length === 1;
  };

  async addSubclass(clas, sub) {
    if (await this.subclassExists(clas, sub)) {
      throw new DuplicateError("Duplicate Subclass", "That Subclass already exists in the Database!");
    }

    const sql = "INSERT INTO subclasses (class_id, name, description, caster, cast_lvl) VALUES($1, $2, $3, $4, $5)";
    await this.query(sql, [clas.id, sub.name, sub.description, sub.caster, sub.cast_lvl])

    return "Successfully added Subclass to Database";
  };

  async remSubclass(clas, sub) {
    if (!(await this.subclassExists(clas, sub))) {
      throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
    }

    await this.query("DELETE FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])

    return "Successfully removed Subclass from Database";
  };

  async updateSubclass(clas, sub) {
    if (!(await this.subclassExists(clas, sub))) {
      throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
    }

    const sql = "UPDATE subclasses SET name = $1, description = $2, caster = $3, cast_lvl = $4 WHERE class_id = $5 AND id = $6";
    await this.query(sql, [sub.name, sub.description, sub.caster, sub.cast_lvl, clas.id, sub.id])

    return "Successfully updated Subclass in Database";
  };

  async getSubclassTrait(sub, trait) {
    if (!trait) {
      const results = await this.query("SELECT * FROM subclass_traits WHERE sub_id = $1", [sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subclass Traits found", "Could not find any Traits for that Subclass in the Database!");
      }

      return results;
    }

    if (trait.id) {
      const results = await this.query("SELECT * FROM subclass_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])

      if (results.length === 0) {
        throw new NotFoundError("Subclass Trait not found", "Could not find that Trait for that Subclass in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM subclass_traits WHERE sub_id = $1 AND name = $2", [sub.id, trait.name])

    if (results.length === 0) {
      throw new NotFoundError("Subclass Trait not found", "Could not find a Trait with that name for that Subclass in the Database!");
    }

    return results[0];
  };

  async subclassTraitExists(sub, trait) {
    if (trait.id) {
      const results = await this.query("SELECT * FROM subclass_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM subclass_traits WHERE sub_id = $1 AND name = $2", [sub.id, trait.name])

    return results.length === 1;
  };

  async addSubclassTrait(sub, trait) {
    if (await this.subclassTraitExists(sub, trait)) {
      throw new DuplicateError("Duplicate Subclass Trait", "That Trait already exists for that Subclass in the Database!");
    }

    const sql = "INSERT INTO subclass_traits (sub_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)"
    await this.query(sql, [sub.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])

    return "Successfully added Subclass Trait to Database";
  };

  async remSubclassTrait(sub, trait) {
    if (!(await this.subclassTraitExists(sub, trait))) {
      throw new NotFoundError("Subclass Trait not found", "Could not find that Trait for that Subclass in the Database!");
    }

    await this.query("DELETE FROM subclass_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])

    return "Successfully removed Subclass Trait from Database";
  };

  async updateSubclassTrait(sub, trait) {
    if (!(await this.subclassTraitExists(sub, trait))) {
      throw new NotFoundError("Subclass Trait not found", "Could not find that Trait for that Subclass in the Database!");
    }

    const sql = "UPDATE subclass_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg-dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE sub_id = $12 AND id = $13";
    await this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, sub.id, trait.id])

    return "Successfully updated Subclass Trait in Database";
  };

  async getSubclassProf(sub, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM subclass_proficiencies WHERE sub_id = $1", [sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subclass Proficiencies found", "Could not find any Proficiencies for that Subclass in the Database!");
      }

      return Promise.all(results.map(async (subProf) => {
        const dbProf = await this.getProficiency({id: subProf.type})

        return {
          id: subProf.id,
          sub_id: sub.id,
          name: subProf.name,
          type: dbProf.name,
          expert: subProf.expert
        }
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Subclass Proficiency not found", "Could not find that Proficiency for that Subclass in the Database!");
      }

      const subProf = results[0];

      const dbProf = await this.getProficiency({id: subProf.type})

      return {
        id: subProf.id,
        sub_id: sub.id,
        name: subProf.name,
        type: dbProf.name,
        expert: subProf.expert
      };
    }

    const results = await this.query("SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type = $3", [sub.id, prof.name, prof.type])

    if (results.length === 0) {
      throw new NotFoundError("Subclass Proficiency not found", "Could not find a Subclass Proficiency with that name in the Database!");
    }

    const subProf = results[0];

    const dbProf = await this.getProficiency({id: subProf.type})

    return {
      id: subProf.id,
      sub_id: sub.id,
      name: subProf.name,
      type: dbProf.name,
      expert: subProf.expert
    };
  };

  async subclassProfExists(sub, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type = $3", [sub.id, prof.name, prof.type])

    return results.length === 1;
  };

  async addsubclassProf(sub, prof) {
    try {
      const subProf = await this.getSubclassProf(sub, prof)

      if (subProf.expert === prof.expert) {
        throw new DuplicateError("Duplicate Subclass Proficiency", "That Subclass Proficiency already exists in the Database!");
      }

      await this.query("UPDATE subclass_proficiencies SET expert = $1 WHERE sub_id = $2 AND id = $2", [prof.expert, sub.id, prof.id])

      return "Successfully updated Subclass Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO subclass_proficiencies (sub_id, name, type, expert) VALUES($1, $2, $3, $4)";
      await this.query(sql, [sub.id, prof.name, prof.type, prof.expert])

      return "Successfully added Subclass Proficiency to Database";
    }
  };

  async remSubclassProf(sub, prof) {
    if (!(await this.subclassProfExists(sub, prof))) {
      throw new NotFoundError("Subclass Proficiency not found", "Could not find that Proficiency for that Subclass in the Database!");
    }

    await this.query("DELETE FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

    return "Successfully removed Subclass Proficiency from Database";
  };

  async updateSubclassProf(sub, prof) {
    if (!(await this.subclassProfExists(sub, prof))) {
      throw new NotFoundError("Subclass Proficiency not found", "Could not find that Proficiency for that Subclass in the Database!");
    }

    await this.query("UPDATE subclass_proficiencies SET name = $1, expert = $2, type = $3 WHERE sub_id = $4 AND id = $5", [prof.name, prof.expert, prof.type, sub.id, prof.id])

    return "Successfully updated Subclass Proficiency in Database";
  };

  async getCharSubclassProf(char, sub, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2", [char.id, sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Subclass Proficiencies found", "Could not find any Subclass Proficiencies for that Character in the Database!");
      }

      return Promise.all(results.map(async (charSubProf) => {
        const dbProf = await this.getProficiency({id: charSubProf.type})

        return {
          id: charSubProf.id,
          sub_id: sub.id,
          char_id: char.id,
          name: charSubProf.name,
          type: dbProf.name,
          expert: charSubProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Subclass Proficiency not found", "Could not find that Subclass Proficiency for that Character in the Database!");
      }

      const charSubProf = results[0];
      const dbProf = await this.getProficiency({id: charSubProf.type})

      return {
        id: charSubProf.id,
        sub_id: sub.id,
        char_id: char.id,
        name: charSubProf.name,
        type: dbProf.name,
        expert: charSubProf.expert
      };
    }

    const results = await this.query("SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3", [char.id, sub.id, prof.name])

    if (results.length === 0) {
      throw new NotFoundError("Character Subclass Proficiency not found", "Could not find a Subclass Proficiency with that name for that Character in the Database!");
    }

    const charSubProf = results[0];
    const dbProf = await this.getProficiency({id: charSubProf.type})

    return {
      id: charSubProf.id,
      sub_id: sub.id,
      char_id: char.id,
      name: charSubProf.name,
      type: dbProf.name,
      expert: charSubProf.expert
    };
  };

  async charSubclassProfExists(char, sub, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3", [char.id, sub.id, prof.name])

    return results.length === 1;
  };

  async addCharSubclassProf(char, sub, prof) {
    try {
      const charSubProf = await this.getCharSubclassProf(char, sub, prof)

      if (charSubProf.expert === prof.expert) {
        throw new DuplicateError("Duplicate Character Subclass Proficiency", "That Subclass Proficiency is already linked to that Character!");
      }

      const sql = "UPDATE character_subclass_profs SET expert = $1 WHERE char_id = $2 AND sub_id = $3 AND id = $4";
      await this.query(sql, [prof.expert, char.id, sub.id, prof.id])

      return "Successfully updated Character Subclass Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO character_subclass_profs (char_id, sub_id, name, type, expert) VALUES($1, $2, $3, $4, $5)";
      await this.query(sql, [char.id, sub.id, prof.name, prof.type, prof.expert])

      return "Successfully added Subclass Proficiency to that Character in Database";
    }
  };

  async remCharSubclassProf(char, sub, prof) {
    if (!(await this.charSubclassProfExists(char, sub, prof))) {
      throw new NotFoundError("Character Subclass Proficiency not found", "Could not find that Subclass Proficiency of that Character in the Database!");
    }

    await this.query("DELETE FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

    return "Successfully removed Subclass Proficiency of that Character from Database";
  };

  async updateCharSubclassProf(char, sub, prof) {
    if (!(await this.charSubclassProfExists(char, sub, prof))) {
      throw new NotFoundError("Character Subclass Proficiency not found", "Could not find that Subclass Proficiency of that Character in the Database!");
    }

    const sql = "UPDATE character_subclass_profs SET name = $1, type = $2, expert = $3 WHERE char_id = $4 AND sub_id = $5 AND id = $6";
    await this.query(sql, [prof.name, prof.type, prof.expert, char.id, sub.id, prof.id])

    return "Successfully updated Character Subclass Proficiency in Database";
  };

  async getSubclassSense(sub, sense) {
    if (!sense) {
      const results = await this.query("SELECT * FROM subclass_senses WHERE sub_id = $1", [sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subclass Senses found", "Could not find any Senses for that Subclass in the Database!")
      }

      return Promise.all(results.map(async (subSense) => {
        const dbSense = await this.getSense({id: subSense.sense_id})

        return {
          id: subSense.id,
          sub_id: sub.id,
          name: dbSense.name,
          range: subSense.range
        };
      }));
    }

    if (sense.id) {
      const results = await this.query("SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2", [sub.id, sense.id])

      if (results.length === 0) {
        throw new NotFoundError("Subclass Sense not found", "Could not find that Sense for that Subclass in the Database!");
      }

      const subSense = results[0];
      const dbSense = await this.getSense({id: subSense.sense_id})

      return {
        id: subSense.id,
        sub_id: sub.id,
        name: dbSense.name,
        range: subSense.range
      };
    }

    const dbSense = await this.getSense({name: sense.name})

    const results = await this.query("SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2", [sub.id, dbSense.id])

    const subSense = results[0];

    return {
      id: subSense.id,
      sub_id: sub.id,
      name: dbSense.name,
      range: subSense.range
    };
  };

  async addSubclassSense(sub, sense) {
    try {
      const subSense = await this.getSubclassSense(sub, sense)

      if (sense.range <= subSense.range) {
        throw new DuplicateError("Duplicate Subclass Sense", "That Sense is already linked to that Subclass with the same or a higher range!");
      }

      await this.query("UPDATE subclass_senses SET range = $1 WHERE sub_id = $2 AND id = $3", [sense.range, sub.id, sense.id])

      return "Successfully updated Subclass Sense in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO subclass_senses (sub_id, sense_id, range) VALUES($1, $2, $3)";
      await this.query(sql, [sub.id, sense.sense_id, sense.range])

      return "Successfully added Subclass Sense to Database";
    }
  };

  async subclassSenseExists(sub, sense) {
    if (sense.id) {
      const results = await this.query("SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2", [sub.id, sense.id])

      return results.length === 1;
    }

    const dbSense = await this.getSense({name: sense.name})
    const results = await this.query("SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2", [sub.id, dbSense.id])

    return results.length === 1;
  };

  async remSubclassSense(sub, sense) {
    if (!(await this.subclassSenseExists(sub, sense))) {
      throw new NotFoundError("Subclass Sense not found", "Could not find that Sense for that Subclass in the Database!");
    }

    await this.query("DELETE FROM subclass_senses WHERE sub_id = $1 AND id = $2", [sub.id, sense.id])

    return "Successfully removed Subclass Sense from Database";
  };

  async updateSubclassSense(sub, sense) {
    if (!(await this.subclassSenseExists(sub, sense))) {
      throw new NotFoundError("Subclass Sense not found", "Could not find that Sense for that Subclass in the Database!");
    }

    const sql = "UPDATE subclass_senses SET sense_id = $1, range = $2 WHERE sub_id = $3 AND id = $4";
    await this.query(sql, [sense.sense_id, sense.range, sub.id, sense.id])

    return "Successfully updated Subclass Sense in Database";
  };

  async getRace(race) {
    if (!race) {
      const results = await this.query("SELECT * FROM races")

      if (results.length === 0) {
        throw new NotFoundError("No Races found", "Could not find any Races in the Database!");
      }

      return Promise.all(results.map(async (dbRace) => {
        const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
          this.getRaceStat(race),
          this.getRaceImmunities(race),
          this.getRaceResistances(race),
          this.getRaceProficiency(race),
          this.getRaceSense(race),
          this.getRaceTrait(race)
        ]);

        return {
          id: dbRace.id,
          name: dbRace.name,
          description: dbRace.description,
          speed: dbRace.speed,
          sub: dbRace.sub,
          feat: dbRace.feat,
          stats: raceStats,
          immunities: raceImmunities,
          resistances: raceResistances,
          profs: raceProfs,
          senses: raceSenses,
          traits: raceTraits
        };
      }));
    }

    if (race.id) {
      const results = await this.query("SELECT * FROM races WHERE id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("Race not found", "Could not find that Race in the Database!");
      }

      const dbRace = results[0];

      const [raceStats,raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
        this.getRaceStat(race),
        this.getRaceImmunities(race),
        this.getRaceResistances(race),
        this.getRaceProficiency(race),
        this.getRaceSense(race),
        this.getRaceTrait(race)
      ]);

      return {
        id: dbRace.id,
        name: dbRace.name,
        description: dbRace.description,
        speed: dbRace.speed,
        sub: dbRace.sub,
        stats: raceStats,
        immunities: raceImmunities,
        resistances: raceResistances,
        profs: raceProfs,
        senses: raceSenses,
        traits: raceTraits
      };
    }

    const results = await this.query("SELECT * FROM races WHERE name = $1", [race.name])

    if (results.length === 0) {
      throw new NotFoundError("Race not found", "Could not find a Race with that name in the Database!");
    }

    const dbRace = results[0];

    const [raceStats,raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
      this.getRaceStat(race),
      this.getRaceImmunities(race),
      this.getRaceResistances(race),
      this.getRaceProficiency(race),
      this.getRaceSense(race),
      this.getRaceTrait(race)
    ]);

    return {
      id: dbRace.id,
      name: dbRace.name,
      description: dbRace.description,
      speed: dbRace.speed,
      sub: dbRace.sub,
      stats: raceStats,
      immunities: raceImmunities,
      resistances: raceResistances,
      profs: raceProfs,
      senses: raceSenses,
      traits: raceTraits
    };
  };

  async raceExists(race) {
    if (race.id) {
      const results = await this.query("SELECT * FROM races WHERE id = $1", [race.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM races WHERE name = $1", [race.name])

    return results.length === 1;
  };

  async addRace(race) {
    if (await this.raceExists(server, race)) {
      throw new DuplicateError("Duplicate Race", "That Race already exists in the Database!");
    }

    const sql = "INSERT INTO races (name, description, speed, sub, feat) VALUES($1, $2, $3, $4, $5)";
    await this.query(sql, [race.name, race.description, race.speed, race.sub, race.feat])

    return "Successfully added Race to Database!";
  };

  async remRace(race) {
    if (!(await this.raceExists(race))) {
      throw new NotFoundError("Race not found", "Could not find that Race in the Database!");
    }

    await this.query("DELETE FROM races WHERE id = $1", [race.id])

    return "Successfully removed Race from Database";
  };

  async updateRace(race) {
    if (!(await this.raceExists(race))) {
      throw new NotFoundError("Race not found", "Could not find that Race in the Database!");
    }

    const sql = "UPDATE races SET name = $1, description = $2, speed = $3, sub = $4, feat = $5 WHERE id = $6";
    await this.query(sql, [race.name, race.description, race.speed, race.sub, race.feat, race.id])

    return "Successfully updated Race in Database";
  };

  async getRaceStat(race, stat) {
    if (!stat) {
      const results = await this.query("SELECT * FROM race_stats WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Stats found", "Could not find any Stats for that Race in the Database!");
      }

      return Promise.all(results.map(async (raceStat) => {
        const dbStat = await this.getStat({key: raceStat.stat})

        return {
          id: raceStat.id,
          race_id: race.id,
          stat: dbStat.name,
          val: raceStat.val
        };
      }));
    }

    if (stat.id) {
      const results = await this.query("SELECT * FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
      }

      const raceStat = results[0];
      const dbStat = await this.getStat({key: raceStat.stat})

      return {
        id: raceStat.id,
        race_id: race.id,
        stat: dbStat.name,
        val: raceStat.val
      };
    }

    const dbStat = await this.getStat({name: stat.name})
    const results = await this.query("SELECT * FROM race_stats WHERE race_id = $1 AND stat = $2", [race.id, dbStat.key])

    if (results.length === 0) {
      throw new NotFoundError("Race Stat not found", "That Race does not have that Stat in the Database!");
    }

    const raceStat = results[0];

    return {
      id: raceStat.id,
      race_id: race.id,
      stat: dbStat.name,
      val: raceStat.val
    };
  };

  async raceStatExists(race, stat) {
    if (stat.id) {
      const results = await this.query("SELECT * FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])

      return results.length === 1;
    }

    const dbStat = await this.getStat({name: stat.name})
    const results = await this.query("SELECT * FROM race_stats WHERE race_id = $1 AND stat = $2", [race.id, dbStat.key])

    return results.length === 1;
  };

  async addRaceStat(race, stat) {
    try {
      const raceStat = await this.getRaceStat(race, stat)

      if (stat.val === raceStat.val) {
        throw new DuplicateError("Duplicate Race Stat", "That Race already has that Stat with that value in the Database!");
      }

      await this.query("UPDATE race_stats SET val = $1 WHERE race_id = $2 AND id = $3", [stat.val, race.id, stat.id])

      return "Successfully updated Race Stat in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO race_stats (race_id, stat, val) VALUES($1, $2, $3)";
      await this.query(sql, [race.id, stat.key, stat.val])

      return "Successfully added Race Stat to Database";
    }
  };

  async remRaceStat(race, stat) {
    if (!(await this.raceStatExists(race, stat))) {
      throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
    }

    await this.query("DELETE FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])

    return "Successfully removed Race Stat from Database";
  };

  async updateRaceStat(race, stat) {
    if (!(await this.raceStatExists(race, stat))) {
      throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
    }

    const sql = "UPDATE race_stats SET stat = $1, val = $2 WHERE race_id = $3 AND id = $4";
    await this.query(sql, [stat.key, stat.val, race.id, stat.id])

    return "Successfully updated Race Stat in Database";
  };

  async getCharRaceFeat(server, char, race, feat) {
    if (!feat) {
      const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2", [char.id, race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Race Feats found", "Could not find any racial Feats for that Character in the Database!");
      }

      return Promise.all(results.map(async (charRaceFeat) => {
        const dbFeat = await this.getFeat(server, {id: charRaceFeat.feat_id})

        return {
          id: charRaceFeat.id,
          char_id: char.id,
          race_id: race.id,
          feat_id: dbFeat.id,
          name: dbFeat.name,
          description: dbFeat.description
        };
      }));
    }

    if (feat.id) {
      const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, feat.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Race Feat not found", "Could not find that racial Feat for that Character in the Database!");
      }

      const charRaceFeat = results[0];
      const dbFeat = await this.getFeat(server, {id: charRaceFeat.feat_id})

      return {
        id: charRaceFeat.id,
        char_id: char.id,
        race_id: race.id,
        feat_id: dbFeat.id,
        name: dbFeat.name,
        description: dbFeat.description
      };
    }

    if (feat.feat_id) {
      const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3", [char.id, race.id, feat.feat_id])

      if (results.length === 0) {
        throw new NotFoundError("Character Race Feat not found", "Could not find that racial Feat for that Character in the Database!");
      }

      const charRaceFeat = results[0];
      const dbFeat = await this.getFeat(server, {id: charRaceFeat.feat_id})

      return {
        id: charRaceFeat.id,
        char_id: char.id,
        race_id: race.id,
        feat_id: dbFeat.id,
        name: dbFeat.name,
        description: dbFeat.description
      };
    }

    const dbFeat = await this.getFeat(server, {name: feat.name})
    const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3", [char.id, race.id, dbFeat.id])

    if (results.length === 0) {
      throw new NotFoundError("Character Race Feat not found", "Could not find a racial Feat with that name for that Character in the Database!");
    }

    const charRaceFeat = results[0];

    return {
      id: charRaceFeat.id,
      char_id: char.id,
      race_id: race.id,
      feat_id: dbFeat.id,
      name: dbFeat.name,
      description: dbFeat.description
    };
  };

  async charRaceFeatExists(char, race, feat) {
    if (feat.id) {
      const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, feat.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3", [char.id, race.id, feat.feat_id])

    return results.length === 1;
  };

  async addCharRaceFeat(char, race, feat) {
    if (await this.charRaceFeatExists(char, race, feat)) {
      throw new DuplicateError("Duplicate Character Race Feat", "That Character already has that racial Feat!");
    }

    const sql = "INSERT INTO character_race_feats (char_id, race_id, feat_id) VALUES($1, $2, $3)";
    await this.query(sql, [char.id, race.id, feat.feat_id])

    return "Successfully added Race Feat to Character in Database";
  };

  async remCharRaceFeat(char, race, feat) {
    if (!(await this.charRaceFeatExists(char, race, feat))) {
      throw new NotFoundError("Character Race Feat not found", "Could not find that racial Feat for that Character in the Database!");
    }

    await this.query("DELETE FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, feat.id])

    return "Successfully removed racial Feat from Character in Database";
  };

  async updateCharRaceFeat(char, race, feat) {
    if (!(await this.charRaceFeatExists(char, race, feat))) {
      throw new NotFoundError("Character Race Feat not found", "Could not find that racial Feat for that Character in the Database!");
    }

    const sql = "UPDATE character_race_feats SET feat_id = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4";
    await this.query(sql, [feat.feat_id, char.id, race.id, feat.id])

    return "Successfully updated Character Race Feat in Database";
  };

  async getRaceImmunity(server, race, immune) {
    if (!immune) {
      const results = await this.query("SELECT * FROM race_immunities WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Immunities found", "Could not find any Immunities for that Race in the Database!");
      }

      return Promise.all(results.map(async (raceImmune) => {
        let dbImmune;

        switch (raceImmune.type) {
          case "damagetype":
            dbImmune = await this.getDamagetype(server, {id: raceImmune.imm_id})
          break;
          case "condition":
            dbImmune = await this.getCondition(server, {id: raceImmune.imm_id})
          break;
        }

        return {
          id: raceImmune.id,
          race_id: race.id,
          type: raceImmune.type,
          name: dbImmune.name,
          imm_id: dbImmune.id
        };
      }));
    }

    if (immune.id) {
      const results = await this.query("SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2", [race.id, immune.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Immunity not found", "Could not find that Immunity for that Race in the Database!");
      }

      const raceImmune = results[0];

      let dbImmune;

      switch (raceImmune.type) {
        case "damagetype":
          dbImmune = await this.getDamagetype(server, {id: raceImmune.imm_id})
        break;
        case "condition":
          dbImmune = await this.getCondition(server, {id: raceImmune.imm_id})
        break;
      }

      return {
        id: raceImmune.id,
        race_id: race.id,
        type: raceImmune.type,
        name: dbImmune.name,
        imm_id: dbImmune.id
      };
    }

    let dbImmune;

    switch (immunity.type) {
      case "damagetype":
        dbImmune = await this.getDamagetype(server, {name: immune.name})
      break;
      case "condition":
        dbImmune = await this.getCondition(server, {name: immune.name})
      break;
    }

    const results = await this.query("SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2", [race.id, dbImmune.id])

    if (results.length === 0) {
      throw new NotFoundError("Race Immunity not found", "Could not find an Immunity with that name for that Race in the Database!");
    }

    const raceImmune = results[0];

    return {
      id: raceImmune.id,
      race_id: race.id,
      type: raceImmune.type,
      name: dbImmune.name,
      imm_id: dbImmune.id
    };
  };

  async raceImmunityExists(server, race, immune) {
    if (immune.id) {
      const results = await this.query("SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2", [race.id, immune.id])

      return results.length === 1;
    }

    let dbImmune;

    switch (immunity.type) {
      case "damagetype":
        dbImmune = await this.getDamagetype(server, {name: immune.name})
      break;
      case "condition":
        dbImmune = await this.getCondition(server, {name: immune.name})
      break;
    }

    const results = await this.query("SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2", [race.id, dbImmune.id])

    return results.length === 1;
  };

  async addRaceImmunity(server, race, immune) {
    if (await this.raceImmunityExists(server, race, immune)) {
      throw new DuplicateError("Duplicate Race Immunity", "That Race already has that Immunity in the Database!");
    }

    const sql = "INSERT INTO race_immunities (race_id, imm_id, type) VALUES($1, $2, $3)";
    await this.query(sql, [race.id, immune.imm_id, immune.type])

    return "Successfully added Race Immunity to Database";
  };

  async remRaceImmunity(race, immune) {
    if (!(await this.raceImmunityExists(server, race, immune))) {
      throw new NotFoundError("Race Immunity not found", "Could not find that Immunity for that Race in the Database!");
    }

    await this.query("DELETE FROM race_immunities WHERE race_id = $1 AND id = $2", [race.id, immune.id])

    return "Successfully removed Race Immunity from Database";
  };

  async getRaceResistance(server, race, resist) {
    if (!resist) {
      const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Resistances found", "Could not find any Resistances for that Race in the Database!");
      }

      return Promise.all(results.map(async (raceResist) => {
        let dbResist;

        switch (raceResist.type) {
          case "damagetype":
            dbResist = await this.getDamagetype(server, {id: raceResist.res_id})
          break;
          case "condition":
            dbResist = await this.getCondition(server, {id: raceResist.res_id})
          break;
        }

        return {
          id: raceResist.id,
          race_id: race.id,
          type: raceResist.type,
          name: dbResist.name,
          res_id: dbResist.id
        };
      }));
    }

    if (resist.id) {
      const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Resistance not found", "Could not find that Resistance for that Race in the Database!");
      }

      const raceResist = results[0];
      
      let dbResist;

      switch (raceResist.type) {
        case "damagetype":
          dbResist = await this.getDamagetype(server, {id: raceResist.res_id})
        break;
        case "condition":
          dbResist = await this.getCondition(server, {id: raceResist.res_id})
        break;
      }

      return {
        id: raceResist.id,
        race_id: race.id,
        type: raceResist.type,
        name: dbResist.name,
        res_id: dbResist.id
      };
    }

    let dbResist;

    switch (raceResist.type) {
      case "damagetype":
        dbResist = await this.getDamagetype(server, {name: resist.name})
      break;
      case "condition":
        dbResist = await this.getCondition(server, {name: resist.name})
      break;
    }

    const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2", [race.id, dbResist.id])

    if (results.length === 0) {
      throw new NotFoundError("Race Resistance not found", "Could not find a Resistance with that name for that Race in the Database!");
    }

    const raceResist = results[0];

    return {
      id: raceResist.id,
      race_id: race.id,
      type: raceResist.type,
      name: dbResist.name,
      res_id: dbResist.id
    };
  };

  async raceResistanceExists(server, race, resist) {
    if (resist.id) {
      const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])

      return results.length === 1;
    }

    let dbResist;

    switch (raceResist.type) {
      case "damagetype":
        dbResist = await this.getDamagetype(server, {name: resist.name})
      break;
      case "condition":
        dbResist = await this.getCondition(server, {name: resist.name})
      break;
    }

    const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2", [race.id, dbResist.id])

    return results.length === 1;
  };

  async addRaceResistance(server, race, resist) {
    if (await this.raceResistanceExists(server, race, resist)) {
      throw new DuplicateError("Duplicate Race Resistace", "That Race already has that Resistance in the Database!");
    }

    const sql = "INSERT INTO race_resistances (race_id, res_id, type) VALUES($1, $2, $3)";
    await this.query(sql, [race.id, resist.res_id, resist.type])

    return "Successfully added Race Resistance to Database";
  };

  async remRaceResistance(server, race, resist) {
    if (!(await this.raceResistanceExists(server, race, resist))) {
      throw new NotFoundError("Race Resistance not found", "Could not find that Resistance for that Race in the Database!");
    }

    await this.query("DELETE FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])

    return "Successfully removed Race Resistance from Database";
  };

  async getRaceProficiency(race, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM race_proficiencies WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Proficiencies found", "Could not find any Race Proficiencies in the Database!");
      }

      return Promise.all(results.map(async (raceProf) => {
        const dbProf = await this.getProficiency({id: raceProf.type})

        return {
          id: raceProf.id,
          race_id: race.id,
          name: raceProf.name,
          type: dbProf.name,
          expert: raceProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Proficiency not found", "Could not find that Race Proficiency in the Database!");
      }

      const raceProf = results[0];
      const dbProf = await this.getProficiency({id: raceProf.type})

      return {
        id: raceProf.id,
        race_id: race.id,
        name: raceProf.name,
        type: dbProf.name,
        expert: raceProf.expert
      };
    }

    const results = await this.query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2", [race.id, prof.name])

    if (results.length === 0) {
      throw new NotFoundError("Race Proficiency not found", "Could not find a Race Proficiency with that name in the Database!");
    }

    const raceProf = results[0];
    const dbProf = await this.getProficiency({id: raceProf.type})

    return {
      id: raceProf.id,
      race_id: race.id,
      name: raceProf.name,
      type: dbProf.name,
      expert: raceProf.expert
    };
  };

  async raceProfExists(race, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2", [race.id, prof.name])

    return results.length === 1;
  };

  async addRaceProficiency(race, prof) {
    try {
      const raceProf = await this.getRaceProficiency(race, prof)

      if (prof.expert === raceProf.expert) {
        throw new DuplicateError("Duplicate Race Proficiency", "That Race Proficiency already exists in the Database!");
      }

      const sql = "UPDATE race_proficiencies SET expert = $1 WHERE race_id = $2 AND id = $3";
      await this.query(sql, [prof.expert, race.id, prof.id])

      return "Successfully updated Race Proficiency in the Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO race_proficiencies (race_id, name, type, expert) VALUES($1, $2, $3, $4)";
      await this.query(sql, [race.id, prof.name, prof.type, prof.expert])

      return "Successfully added Race Proficiency to Database";
    }
  };

  async remRaceProficiency(race, prof) {
    if (!(await this.raceProfExists(race, prof))) {
      throw new NotFoundError("Race Proficiency not found", "Could not find that Race Proficiency in the Database!");
    }

    await this.query("DELETE FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])

    return "Successfully removed Race Proficiency from Database";
  };

  async getCharRaceProf(char, race, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2", [char.id, race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Race Proficiencies found", "Could not find any racial Proficiencies for that Character in the Database!");
      }

      return Promise.all(results.map(async (charRaceProf) => {
        const dbProf = await this.getProficiency({id: charRaceProf.type})

        return {
          id: charRaceProf.id,
          char_id: char.id,
          race_id: race.id,
          name: charRaceProf.name,
          type: dbProf.name,
          expert: charRaceProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Race Proficiency not found", "Could not find that racial Proficiency of that Character in the Database!");
      }

      const charRaceProf = results[0];
      const dbProf = await this.getProficiency({id: charRaceProf.type})

      return {
        id: charRaceProf.id,
        char_id: char.id,
        race_id: race.id,
        name: charRaceProf.name,
        type: dbProf.name,
        expert: charRaceProf.expert
      };
    }

    const results = await this.query("SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND name = $3", [char.id, race.id, prof.name])

    const charRaceProf = results[0];
    const dbProf = await this.getProficiency({id: charRaceProf.type})

    return {
      id: charRaceProf.id,
      char_id: char.id,
      race_id: race.id,
      name: charRaceProf.name,
      type: dbProf.name,
      expert: charRaceProf.expert
    };
  };

  async charRaceProfExists(char, race, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND name = $3", [char.id, race.id, prof.name])

    return results.length === 1;
  };

  async addCharRaceProf(char, race, prof) {
    try {
      const charRaceProf = await this.getCharRaceProf(char, race, prof)

      if (prof.expert === charRaceProf.expert) {
        throw new DuplicateError("Duplicate Character Race Proficiency", "That Character already has that racial Proficiency in the Database!");
      }

      const sql = "UPDATE character_race_profs SET expert = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4";
      await this.query(sql, [prof.expert, char.id, race.id, prof.id])

      return "Successfully updated Character Race Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO character_race_profs (char_id, race_id, name, type, expert) VALUES($1, $2, $3, $4, $5)";
      await this.query(sql, [char.id, race.id, prof.name, prof.type, prof.expert])

      return "Successfully added Race Proficiency to Character in Database";
    }
  };

  async remCharRaceProf(char, race, prof) {
    if (!(await this.charRaceProfExists(char, race, prof))) {
      throw new NotFoundError("Character Race Proficiency not found", "Could not find that Race Proficiency for that Character in the Database!");
    }

    await this.query("DELETE FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3", [char.id, race.id, prof.id])

    return "Successfully removed Race Proficiency from Character in Database";
  };

  async updateCharRaceProf(char, race, prof) {
    if (!(await this.charRaceProfExists(char, race, prof))) {
      throw new NotFoundError("Character Race Proficiency not found", "Could not find that Race Proficiency for that Character in the Database!");
    }

    const sql = "UPDATE character_race_profs SET expert = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4";
    await this.query(sql, [prof.expert, char.id, race.id, prof.id])

    return "Successfully updated Character Race Proficiency in Database";
  };

  async getRaceSense(race, sense) {
    if (!sense) {
      const results = await this.query("SELECT * FROM race_senses WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Senses found", "Could not find any Senses for that Race in the Database!");
      }

      return Promise.all(results.map(async (raceSense) => {
        const dbSense = await this.getSense({key: raceSense.key})

        return {
          id: raceSense.id,
          race_id: race.id,
          name: dbSense.name,
          range: raceSense.range,
          key: dbSense.key
        };
      }));
    }

    if (sense.id) {
      const results = await this.query("SELECT * FROM race_senses WHERE race_id = $1 AND id = $2", [race.id, sense.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Sense not found", "Could not find that Sense for that Race in the Database!");
      }

      const raceSense = results[0];
      const dbSense = await this.getSense({key: raceSense.key})

      return {
        id: raceSense.id,
        race_id: race.id,
        name: dbSense.name,
        range: raceSense.range,
        key: dbSense.key
      };
    }

    const dbSense = await this.getSense({name: sense.name})
    const results = await this.query("SELECT * FROM race_senses WHERE race_id = $1 AND key = $2", [race.id, dbSense.key])

    if (results.length === 0) {
      throw new NotFoundError("Race Sense not found", "Could not find a Sense with that name for that Race in the Database!");
    }

    const raceSense = results[0];

    return {
      id: raceSense.id,
      race_id: race.id,
      name: dbSense.name,
      range: raceSense.range,
      key: dbSense.key
    };
  };

  async raceSenseExists(race, sense) {
    if (sense.id) {
      const results = await this.query("SELECT * FROM race_senses WHERE race_id = $1 AND id = $2", [race.id, sense.id])

      return results.length === 1;
    }

    const dbSense = await this.getSense({name: sense.name})
    const results = await this.query("SELECT * FROM race_senses WHERE race_id = $1 AND key = $2", [race.id, dbSense.key])

    return results.length === 1;
  };

  async addRaceSense(race, sense) {
    if (await this.raceSenseExists(race, sense)) {
      throw new DuplicateError("Duplicate Race Sense", "That Sense is already linked to that Race in the Database!");
    }

    const sql = "INSERT INTO race_senses (race_id, key, range) VALUES($1, $2, $3)";
    await this.query(sql, [race.id, sense.key, sense.range])

    return "Successfully added Race Sense to Database";
  };

  async remRaceSense(race, sense) {
    if (!(await this.raceSenseExists(race, sense))) {
      throw new NotFoundError("Race Sense not found", "Could not find that Sense for that Race in the Database!");
    }

    await this.query("DELETE FROM race_senses WHERE race_id = $1 AND id = $2", [race.id, sense.id])

    return "Successfully removed Race Sense from Database";
  };

  async updateRaceSense(race, sense) {
    if (!(await this.raceSenseExists(race, sense))) {
      throw new NotFoundError("Race Sense not found", "Could not find that Sense for that Race in the Database!");
    }

    const sql = "UPDATE race_senses SET range = $1, key = $2 WHERE race_id = $3 AND id = $4";
    await this.query(sql, [sense.range, sense.key, race.id, sense.id])

    return "Successfully updated Race Sense in Database";
  };

  async getRaceTrait(race, trait) {
    if (!trait) {
      const results = await this.query("SELECT * FROM race_traits WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Race Traits found", "Could not find any Traits for that Race in the Database!");
      }

      return results;
    }

    if (trait.id) {
      const results = await this.query("SELECT * FROM race_traits WHERE race_id = $1 AND id = $2", [race.id, trait.id])

      if (results.length === 0) {
        throw new NotFoundError("Race Trait not found", "Could not find that Trait for that Race in the Database!");
      }

      return results[0];
    }

    const results = await this.query("SELECT * FROM race_traits WHERE race_id = $1 AND name = $2", [race.id, trait.name])

    if (results.length === 0) {
      throw new NotFoundError("Race Trait not found", "Could not find a Trait with that name for that Race in the Database!");
    }

    return results[0];
  };

  async raceTraitExists(race, trait) {
    if (trait.id) {
      const results = await this.query("SELECT * FROM race_traits WHERE race_id = $1 AND id = $2", [race.id, sense.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM race_traits WHERE race_id = $1 AND name = $2", [race.id, sense.name])

    return results.length === 1;
  };

  async addRaceTrait(race, trait) {
    if (await this.raceTraitExists(race, trait)) {
      throw new DuplicateError("Duplicate Race Trait", "That Trait is already linked to that Race in the Database!");
    }

    const sql = "INSERT INTO race_traits (race_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
    await this.query(sql, [race.id, trait.level, trait.name, trait.description, trait.type, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])

    return "Successfully added Race Trait to Database";
  };

  async remRaceTrait(race, trait) {
    if (!(await this.raceTraitExists(race, trait))) {
      throw new NotFoundError("Race Trait not found", "Could not find that Trait for that Race in the Database!");
    }

    await this.query("DELETE FROM race_traits WHERE race_id = $1 AND id = $2", [race.id, trait.id])

    return "Successfully removed Race Trait from Database";
  };

  async updateRaceTrait(race, trait) {
    if (!(await this.raceTraitExists(race, trait))) {
      throw new NotFoundError("Race Trait not found", "Could not find that Trait for that Race in the Database!");
    }

    const sql = "UPDATE race_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE race_id = $12 AND id = $13";
    await this.query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, race.id, trait.id])

    return "Successfully updated Race Trait in Database";
  };

  async getSubrace(race, sub) {
    if (!sub) {
      const results = await this.query("SELECT * FROM subraces WHERE race_id = $1", [race.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subraces found", "Could not find any Subraces in the Database!");
      }

      return Promise.all(results.map(async (dbSub) => {
        const [subProfs, subSenses, subTraits] = await Promise.all([
          this.getSubraceProf(sub),
          this.getSubraceSense(sub),
          this.getSubraceTrait(sub)
        ]);

        return {
          id: dbSub.id,
          race_id: race.id,
          name: dbSub.name,
          description: dbSub.description,
          profs: subProfs,
          senses: subSenses,
          traits: subTraits
        };
      }));
    }

    if (sub.id) {
      const results = await this.query("SELECT * FROM subraces WHERE race_id = $1 AND id = $2", [race.id, sub.id])

      if (results.length === 0) {
        throw new NotFoundError("Subrace not found", "Could not find that Subrace in the Database!");
      }

      const dbSub = results[0];

      const [subProfs, subSenses, subTraits] = await Promise.all([
        this.getSubraceProf(sub),
        this.getSubraceSense(sub),
        this.getSubraceTrait(sub)
      ]);

      return {
        id: dbSub.id,
        race_id: race.id,
        name: dbSub.name,
        description: dbSub.description,
        profs: subProfs,
        senses: subSenses,
        traits: subTraits
      };
    }

    const results = await this.query("SELECT * FROM subraces WHERE race_id = $1 AND name = $2", [race.id, sub.name])

    if (results.length === 0) {
      throw new NotFoundError("Subrace not found", "Could not find a Subrace with that name in the Database!");
    }

    const dbSub = results[0];

    const [subProfs, subSenses, subTraits] = await Promise.all([
      this.getSubraceProf(sub),
      this.getSubraceSense(sub),
      this.getSubraceTrait(sub)
    ]);

    return {
      id: dbSub.id,
      race_id: race.id,
      name: dbSub.name,
      description: dbSub.description,
      profs: subProfs,
      senses: subSenses,
      traits: subTraits
    };
  };

  async subraceExists(race, sub) {
    if (sub.id) {
      const results = await this.query("SELECT * FROM subraces WHERE race_id = $1 AND id = $2", [race.id, sub.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM subraces WHERE race_id = $1 AND name = $2", [race.id, sub.name])

    return results.length === 1;
  };

  async addSubrace(race, sub) {
    if (await this.subraceExists(race, sub)) {
      throw new DuplicateError("Duplicate Subrace", "That Subrace already exists in the Database!");
    }

    const sql = "INSERT INTO subraces (race_id, name, description) VALUES($1, $2, $3)";
    await this.query(sql, [race.id, sub.name, sub.description])

    return "Successfully added Subrace to Database";
  };

  async remSubrace(race, sub) {
    if (!(await this.subraceExists(race, sub))) {
      throw new NotFoundError("Subrace not found", "Could not find that Subrace in the Database!");
    }

    await this.query("DELETE FROM subraces WHERE race_id = $1 AND id = $2", [race.id, sub.id])

    return "Successfully removed Subrace from Database";
  };

  async updateSubrace(race, sub) {
    if (!(await this.subraceExists(race, sub))) {
      throw new NotFoundError("Subrace not found", "Could not find that Subrace in the Database!");
    }

    const sql = "UPDATE subraces SET name = $1 AND description = $2 WHERE race_id = $3 AND id = $4";
    await this.query(sql, [sub.name, sub.description, race.id, sub.id])

    return "Sucessfully updated Subrace in Database";
  };

  async getSubraceProf(sub, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM subrace_proficiencies WHERE sub_id = $1", [sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Subrace Proficiencies found", "Could not find any Subrace Proficiencies in the Database!");
      }

      return Promise.all(results.map(async (subProf) => {
        const dbProf = await this.getProficiency({id: subProf.type})

        return {
          id: subProf.id,
          sub_id: sub.id,
          name: subProf.name,
          type: dbProf.name,
          expert: subProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Subrace Proficiency not found", "Could not find that Subrace Proficiency in the Database!");
      }

      const subProf = results[0];
      const dbProf = await this.getProficiency({id: subProf.type})

      return {
        id: subProf.id,
        sub_id: sub.id,
        name: subProf.name,
        type: dbProf.name,
        expert: subProf.expert
      };
    }

    const results = await this.query("SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2", [sub.id, prof.name])

    const subProf = results[0];
    const dbProf = await this.getProficiency({id: subProf.type})

    return {
      id: subProf.id,
      sub_id: sub.id,
      name: subProf.name,
      type: dbProf.name,
      expert: subProf.expert
    };
  };

  async subraceProfExists(sub, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2", [sub.id, prof.name])

    return results.length === 1;
  };

  async addSubraceProf(sub, prof) {
    try {
      const subProf = await this.getSubraceProf(sub, prof)

      if (prof.expert === subProf.expert) {
        throw new DuplicateError("Duplicate Subrace Proficiency", "That Subrace already has that Proficiency in the Database!");
      }

      const sql = "UPDATE subrace_proficiencies SET expert = $1, name = $2 WHERE sub_id = $3 AND id = $4";
      await this.query(sql, [prof.expert, prof.name, sub.id, prof.id])

      return "Successfully updated Subrace Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO subrace_proficiencies (sub_id, name, type, expert) VALUES($1, $2, $3, $4)";
      await this.query(sql, [sub.id, prof.name, prof.type, prof.expert])

      return "Successfully added Subrace Proficiency to Database";
    }
  };

  async remSubraceProf(sub, prof) {
    if (!(await this.subraceProfExists(sub, prof))) {
      throw new NotFoundError("Subrace Proficiency not found", "Could not find that Proficiency for that Subrace in the Database!");
    }

    await this.query("DELETE FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2", [sub.id, prof.id])

    return "Successfully removed Subrace Proficiency from Database";
  };

  async updateSubraceProf(sub, prof) {
    if (!(await this.subraceProfExists(sub, prof))) {
      throw new NotFoundError("Subrace Proficiency not found", "Could not find that Proficiency for that Subrace in the Database!");
    }

    const sql = "UPDATE subrace_proficiencies SET name = $1, type = $2, expert = $3 WHERE sub_id = $4 AND id = $5";
    await this.query(sql, [prof.name, prof.type, prof.expert, sub.id, prof.id])

    return "Successfully updated Subrace Proficiency in Database";
  };

  async getCharSubraceProf(char, sub, prof) {
    if (!prof) {
      const results = await this.query("SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2", [char.id, sub.id])

      if (results.length === 0) {
        throw new NotFoundError("No Character Subrace Proficiencies found", "Could not find any Subrace Proficiencies for that Character in the Database!");
      }

      return Promise.all(results.map(async (charSubProf) => {
        const dbProf = await this.getProficiency({id: charSubProf.type})

        return {
          id: charSubProf.id,
          char_id: char.id,
          sub_id: sub.id,
          name: charSubProf.name,
          type: dbProf.name,
          expert: charSubProf.expert
        };
      }));
    }

    if (prof.id) {
      const results = await this.query("SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

      if (results.length === 0) {
        throw new NotFoundError("Character Subrace Proficiency not found", "Could not find that Subrace Proficiency for that Character in the Database!");
      }

      const charSubProf = results[0];
      const dbProf = await this.getProficiency({id: charSubProf.type})

      return {
        id: charSubProf.id,
        char_id: char.id,
        sub_id: sub.id,
        name: charSubProf.name,
        type: dbProf.name,
        expert: charSubProf.expert
      };
    }

    const results = await this.query("SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3", [char.id, sub.id, prof.name])

    if (results.length === 0) {
      throw new NotFoundError("Character Subrace Proficiency not found", "Could not find a Subrace Proficiency with that name for that Character in the Database!");
    }

    const charSubProf = results[0];
    const dbProf = await this.getProficiency({id: charSubProf.type})

    return {
      id: charSubProf.id,
      char_id: char.id,
      sub_id: sub.id,
      name: charSubProf.name,
      type: dbProf.name,
      expert: charSubProf.expert
    };
  };

  async charSubraceProfExists(char, sub, prof) {
    if (prof.id) {
      const results = await this.query("SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

      return results.length === 1;
    }

    const results = await this.query("SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3", [char.id, sub.id, prof.name])

    return results.length === 1;
  };

  async addCharSubraceProf(char, sub, prof) {
    try {
      const charSubProf = await this.getCharSubraceProf(char, sub, prof)

      if (prof.expert === charSubProf.expert) {
        throw new DuplicateError("Duplicate Character Subrace Proficiency", "That Character already has that Subrace Proficiency in the Database!");
      }

      const sql = "UPDATE character_subrace_profs SET expert = $1, name = $2 WHERE char_id = $3 AND sub_id = $4 AND id = $5";
      await this.query(sql, [prof.expert, prof.name, char.id, sub.id, prof.id])

      return "Successfully updated Character Subrace Proficiency in Database";
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }

      const sql = "INSERT INTO character_subrace_profs (char_id, sub_id, name, type, expert) VALUES($1, $2, $3, $4, $5)";
      await this.query(sql, [char.id, sub.id, prof.name, prof.type, prof.expert])

      return "Successfully added Subrace Proficiency to Character in Database";
    }
  };

  async remCharSubraceProf(char, sub, prof) {
    if (!(await this.charSubraceProfExists(char, sub, prof))) {
      throw new NotFoundError("Character Subrace Proficiency not found", "Could not find that Subrace Proficiency for that Character in the Database!");
    }

    await this.query("DELETE FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3", [char.id, sub.id, prof.id])

    return "Successfully removed Subrace Proficiency from Character in Database";
  };

  async updateCharSubraceProf(char, sub, prof) {
    if (!(await this.charSubraceProfExists(char, sub, prof))) {
      throw new NotFoundError("Character Subrace Proficiency not found", "Could not find that Subrace Proficiency for that Character in the Database!");
    }

    const sql = "UPDATE character_subrace_profs SET name = $1, type = $2, expert = $3 WHERE char_id = $4 AND sub_id = $5 AND id = $6";
    await this.query(sql, [prof.name, prof.type, prof.expert, char.id, sub.id, prof.id])

    return "Successfully updated Subrace Proficiency of Character in Database";
  };

  getSubraceSense(server, race, sub, sense) {
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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
    //TODO: Cleanup
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