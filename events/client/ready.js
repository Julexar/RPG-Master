import { client } from "../../index.js";
class Event {
  constructor() {
    this.name = "ready";
  };

  async run() {
    const commandArray = client.slashCommands;
    commandArray.forEach(cmd => {
      client.database.writeDevLog(`Attemtping to register Command /${cmd.name} in Database...`);
      client.database.getCommand(cmd, "slash")
        .then(c => {
          client.database.writeDevLog(`The Command /${c.name} already exists within the Database!\nChecking if there have been changes...`);
          if (c.enabled != cmd.enabled) {
            client.database.writeDevLog("Found changes, attempting to apply changes in Database...");
            client.database.updateCommand({ id: c.id, enabled: cmd.enabled }, c.type)
              .then(msg => client.database.writeDevLog(`${msg}`))
              .catch(err => client.database.writeDevLog(`${err}`));
          } else {
            client.database.writeDevLog("No changes found, skipping to next Command");
          }
        })
        .catch(err => {
          if (String(err).includes("Error 404")) {
            client.database.writeDevLog(`${err} in Database - attempting to add...`);
            client.database.addCommand(cmd, "slash")
              .then(msg => client.database.writeDevLog(`${msg}`))
              .catch(err1 => client.database.writeDevLog(`Failed to add Command /${cmd.name} to Database!\nReason:\n${err1}`));
          }
        });
    });
    client.user.setPresence(client.config.presence);
    client.database.writeDevLog("Beginning registration of Servers...");
    await client.database.getServer()
      .then(servers => {
        servers.forEach(async (server) => {
          client.database.writeDevLog(`Found Server \"${server.name}\" in Database, checking if it still exists...`);
          if (!client.guilds.cache.has(server.id)) {
            client.database.writeDevLog(`Removing Server \"${server.name}\" from Database because it no longer exists...`);
            await client.database.remServer(server)
              .then(msg => client.database.writeDevLog(msg))
              .catch(err => client.database.writeDevLog(`${err}`));
          } else {
            const guild = client.guilds.cache.get(server.id);
            client.database.writeDevLog("Error 409: This Server already exists");
            client.database.writeDevLog(`Attempting to create new Logfile for Server \"${server.name}\"`);
            await client.database.addLog(guild)
              .then(async (msg) => {
                await client.database.writeLog(guild, msg)
                  .then(msg1 => client.database.writeDevLog(msg1))
                  .catch(err => client.database.writeDevLog(`${err}`));
                await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                  .then(msg1 => client.database.writeDevLog(msg1))
                  .catch(err => client.database.writeDevLog(`${err}`));
                await client.database.getMember(guild)
                  .then(async (users) => {
                    await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                      .then(msg1 => client.database.writeDevLog(msg1))
                      .catch(err => client.database.writeDevLog(`${err}`));
                    await users.forEach(async (user) => {
                      if (!guild.members.cache.get(user.id)) {
                        await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                          .then(msg2 => client.database.writeDevLog(msg2))
                          .catch(err => client.database.writeDevLog(`${err}`));
                        await client.database.remMember(guild, user)
                          .then(async (msg2) => {
                            await client.database.writeLog(guild, msg2)
                              .then(msg3 => client.database.writeDevLog(msg3))
                              .catch(err => client.database.writeDevLog(`${err}`));
                          })
                          .catch(async (err) => {
                            await client.database.writeLog(guild, `${err}`)
                              .then(msg2 => client.database.writeDevLog(msg2))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          });
                      } else {
                        await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                          .then(msg2 => client.database.writeDevLog(msg2))
                          .catch(err => client.database.writeDevLog(`${err}`));
                      }
                    });
                  })
                  .catch(async (err) => {
                    await client.database.writeLog(guild, `${err} in Database - attempting to add...`)
                      .then(msg1 => client.database.writeDevLog(msg1))
                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                    guild.members.cache.forEach(async (member) => {
                      if (!member.user.bot) {
                        await client.database.getMember(guild, member.user)
                          .then(async () => {
                            await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          })
                          .catch(async (err1) => {
                            if (String(err1).includes("Error 404")) {
                              await client.database.addMember(guild, member.user)
                                .then(async (msg1) => {
                                  await client.database.writeLog(guild, msg1)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                })
                                .catch(async (err2) => {
                                  await client.database.writeLog(guild, `${err2}`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err3 => client.database.writeDevLog(err3));
                                });
                            } else {
                              await client.database.writeLog(guild, `${err1}`)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                            }
                          });
                      }
                    });
                  });
              })
              .catch(async (err) => {
                await client.database.writeLog(guild, `${err}`)
                  .then(msg => client.database.writeDevLog(msg))
                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                if (String(err).includes("Error 409")) {
                  await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                    .then(msg => client.database.writeDevLog(msg))
                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                  await client.database.getMember(guild)
                    .then(async (users) => {
                      await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      await users.forEach(async (user) => {
                        if (!guild.members.cache.get(user.user_id)) {
                          await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                            .then(msg => client.database.writeDevLog(msg))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                          await client.database.remMember(guild, user)
                            .then(async (msg) => {
                              await client.database.writeLog(guild, msg)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                            })
                            .catch(async (err1) => {
                              await client.database.writeLog(guild, `${err1}`)
                                .then(msg => client.database.writeDevLog(msg))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                            });
                        } else {
                          await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                            .then(msg => client.database.writeDevLog(msg))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                        }
                      });
                    })
                    .catch(async (err1) => {
                      await client.database.writeLog(guild, `${err1} in Database - attempting to add...`)
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                      guild.members.cache.forEach(async (member) => {
                        if (!member.user.bot) {
                          await client.database.getMember(guild, member.user)
                            .then(async () => {
                              await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                .then(msg => client.database.writeDevLog(msg))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                            })
                            .catch(async (err2) => {
                              if (String(err2).includes("Error 404")) {
                                await client.database.addMember(guild, member.user)
                                  .then(async (msg) => {
                                    await client.database.writeLog(guild, msg)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  })
                                  .catch(async (err3) => {
                                    await client.database.writeLog(guild, `${err3}`)
                                      .then(msg => client.database.writeDevLog(msg))
                                      .catch(err4 => client.database.writeDevLog(err4));
                                  });
                              } else {
                                await client.database.writeLog(guild, `${err2}`)
                                  .then(msg => client.database.writeDevLog(msg))
                                  .catch(err3 => client.database.writeDevLog(`${err3}`));
                              }
                            });
                        }
                      });
                    });
                }
              });
            setInterval(async () => {
              await client.database.getServer(guild)
                .then(async (server) => {
                  if (server.print_logs) {
                    if (server.log_chan) {
                      const channel = guild.channels.cache.get(server.log_chan);
                      await client.database.writeLog(guild, "Printing Logfile...")
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err => client.database.writeDevLog(err));
                      await client.database.getLog(guild)
                        .then(async (log) => {
                          await channel.send({
                            files: [`./logs/server/${server.id}/${log.id}.log`]
                          });
                        })
                        .catch(async (err) => await channel.send({
                          content: `An Error occurred whilst trying to print Logfile:\n${err}`
                        }));
                    } else {
                      await client.database.writeLog(guild, "Error 404: No Log Channel defined")
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err => client.database.writeDevLog(`${err}`));
                    }
                  }
                  await client.database.addLog(guild)
                    .then(async () => {
                      await client.database.remLog(guild)
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err => client.database.writeDevLog(`${err}`));
                    })
                    .catch(err => client.database.writeDevLog(`${err}`));
                })
                .catch(err => client.database.writeDevLog(`${err}`));
            }, 1000 * 60 * 60 * 24);
            //Command Registration
            await client.database.writeLog(guild, "Attempting to register Server Commands...")
              .then(msg => client.database.writeDevLog(msg))
              .catch(err => client.database.writeDevLog(`${err}`));
            await guild.commands.set(commandArray)
              .then(async (commands) => {
                await client.database.writeLog(guild, "Successfully registered Server Commands, attempting to write Server Commands to Database...")
                  .then(msg => client.database.writeDevLog(msg))
                  .catch(err => client.database.writeDevLog(`${err}`));
                commands.forEach(async (command) => {
                  await client.database.writeLog(guild, `Attempting to register Server Command /${command.name} in Database...`)
                    .then(msg => client.database.writeDevLog(msg))
                    .catch(err => client.database.writeDevLog(`${err}`));
                  await client.database.getCommand({ name: command.name }, "slash")
                    .then(async (cmd) => {
                      await client.database.addServCmd(guild, {
                        id: command.id,
                        cmd_id: cmd.id,
                        name: cmd.name,
                        type: "slash"
                      })
                        .then(async (msg) => {
                          await client.database.writeLog(guild, `${msg} - Searching Database for restrictions...`)
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err => client.database.writeDevLog(`${err}`));
                          await client.database.getRestriction(command)
                            .then(async (rests) => {
                              await server.commands.permissions.set({
                                token: client.config.token,
                                permissions: [
                                  {
                                    id: command.id,
                                    permissions: rests
                                  }
                                ]
                              })
                                .then(async () => {
                                  await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(async (err) => {
                                  await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err}`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                });
                            })
                            .catch(async (err) => {
                              await client.database.writeLog(guild, `${err}`)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                            });
                        })
                        .catch(async (err) => {
                          if (String(err).includes("Error 409")) {
                            await client.database.writeLog(guild, `${err} - Searching Database for restrictions...`)
                              .then(msg => client.database.writeDevLog(msg))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            await client.database.getRestriction(command)
                              .then(async (rests) => {
                                await server.commands.permissions.set({
                                  token: client.config.token,
                                  permissions: [
                                    {
                                      id: command.id,
                                      permissions: rests
                                    }
                                  ]
                                })
                                  .then(async () => {
                                    await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                      .then(msg => client.database.writeDevLog(msg))
                                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                                  })
                                  .catch(async (err1) => {
                                    await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                      .then(msg => client.database.writeDevLog(msg))
                                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  });
                              })
                              .catch(async (err1) => {
                                await client.database.writeLog(guild, `${err1}`)
                                  .then(msg => client.database.writeDevLog(msg))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                              });
                          } else {
                            await client.database.writeLog(guild, `Failed to register Server Command /${command.name}\nReason:\n${err}`)
                              .then(msg => client.database.writeDevLog(msg))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          }
                        });
                    })
                    .catch(err => client.database.writeDevLog(`${err}`));
                });
              })
              .catch(err => client.database.writeDevLog(`${err}`));
          }
          client.database.writeDevLog("Beginning registration of existing Servers...")
          client.guilds.cache.forEach(async (server) => {
            client.database.writeDevLog(`Attempting to register Server \"${server.name}\" in Database...`)
            await client.database.getServer(server)
              .then(client.database.writeDevLog("Error 409: Duplicate Server"))
              .catch(async (err) => {
                client.database.writeDevLog(`${err}`)
                if (String(err).includes("Error 404")) {
                  await client.database.addServer({
                    id: server.id,
                    name: server.name,
                    dm_role: null,
                    prefix: client.config.default_prefix
                  })
                    .then(async (msg) => {
                      client.database.writeDevLog(msg);
                      await client.database.addLog(guild)
                        .then(async (msg1) => {
                          //Member Registration
                          await client.database.writeLog(guild, msg1)
                            .then(msg2 => client.database.writeDevLog(msg2))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                          await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                            .then(msg2 => client.database.writeDevLog(msg2))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                          await client.database.getMember(guild)
                            .then(async (users) => {
                              await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                              await users.forEach(async (user) => {
                                if (!guild.members.cache.get(user.id)) {
                                  await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                  await client.database.remMember(guild, user)
                                    .then(async (msg2) => {
                                      await client.database.writeLog(guild, msg2)
                                        .then(msg3 => client.database.writeDevLog(msg3))
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                    })
                                    .catch(async (err1) => {
                                      await client.database.writeLog(guild, `${err1}`)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    });
                                } else {
                                  await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                }
                              });
                            })
                            .catch(async (err1) => {
                              await client.database.writeLog(guild, `${err1} in Database - attempting to add...`)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                              guild.members.cache.forEach(async (member) => {
                                if (!member.user.bot) {
                                  await client.database.getMember(guild, member.user)
                                    .then(async () => {
                                      await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    })
                                    .catch(async (err2) => {
                                      if (String(err2).includes("Error 404")) {
                                        await client.database.addMember(guild, member.user)
                                          .then(async (msg1) => {
                                            await client.database.writeLog(guild, msg1)
                                              .then(msg2 => client.database.writeDevLog(msg2))
                                              .catch(err3 => client.database.writeDevLog(`${err3}`));
                                          })
                                          .catch(async (err3) => {
                                            await client.database.writeLog(guild, `${err3}`)
                                              .then(msg1 => client.database.writeDevLog(msg1))
                                              .catch(err4 => client.database.writeDevLog(err4));
                                          });
                                      } else {
                                        await client.database.writeLog(guild, `${err2}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err3 => client.database.writeDevLog(`${err3}`));
                                      }
                                    });
                                }
                              });
                            });
                        })
                        .catch(async (err1) => {
                          //Member Registration
                          await client.database.writeLog(guild, `${err1}`)
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                          if (String(err1).includes("Error 409")) {
                            await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err2 => client.database.writeDevLog(`${err2}`));
                            await client.database.getMember(guild)
                              .then(async (users) => {
                                await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                                await users.forEach(async (user) => {
                                  if (!guild.members.cache.get(user.id)) {
                                    await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    await client.database.remMember(guild, user)
                                      .then(async (msg1) => {
                                        await client.database.writeLog(guild, msg1)
                                          .then(msg2 => client.database.writeDevLog(msg2))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      })
                                      .catch(async (err2) => {
                                        await client.database.writeLog(guild, `${err2}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err3 => client.database.writeDevLog(`${err3}`));
                                      });
                                  } else {
                                    await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  }
                                });
                              })
                              .catch(async (err2) => {
                                await client.database.writeLog(guild, `${err2} in Database - attempting to add...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err3 => client.database.writeDevLog(`${err3}`));
                                guild.members.cache.forEach(async (member) => {
                                  if (!member.user.bot) {
                                    await client.database.getMember(guild, member.user)
                                      .then(async () => {
                                        await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err3 => client.database.writeDevLog(`${err3}`));
                                      })
                                      .catch(async (err3) => {
                                        if (String(err3).includes("Error 404")) {
                                          await client.database.addMember(guild, member.user)
                                            .then(async (msg1) => {
                                              await client.database.writeLog(guild, msg1)
                                                .then(msg2 => client.database.writeDevLog(msg2))
                                                .catch(err4 => client.database.writeDevLog(`${err4}`));
                                            })
                                            .catch(async (err4) => {
                                              await client.database.writeLog(guild, `${err4}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err5 => client.database.writeDevLog(err5));
                                            });
                                        } else {
                                          await client.database.writeLog(guild, `${err3}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err4 => client.database.writeDevLog(`${err4}`));
                                        }
                                      });
                                  }
                                });
                              });
                          }
                        });
                      setInterval(async () => {
                        await client.database.getServer(guild)
                          .then(async (server) => {
                            if (server.print_logs) {
                              if (server.log_chan) {
                                const channel = guild.channels.cache.get(server.log_chan);
                                await client.database.writeLog(guild, "Printing Logfile...")
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err1 => client.database.writeDevLog(err1));
                                await client.database.getLog(guild)
                                  .then(async (log) => {
                                    await channel.send({
                                      files: [`./logs/server/${server.id}/${log.id}.log`]
                                    });
                                  })
                                  .catch(async (err1) => await channel.send({
                                    content: `An Error occurred whilst trying to print Logfile:\n${err1}`
                                  }));
                              } else {
                                await client.database.writeLog(guild, "Error 404: No Log Channel defined")
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                              }
                            }
                            await client.database.addLog(guild)
                              .then(async () => {
                                await client.database.remLog(guild)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                              })
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          })
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                      }, 1000 * 60 * 60 * 24);
                      //Command Registration
                      await client.database.writeLog(guild, "Attempting to register Server Commands...")
                        .then(msg1 => client.database.writeDevLog(msg1))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      await server.commands.set(commandArray)
                        .then(async (commands) => {
                          await client.database.writeLog(guild, "Successfully registered Server Commands, attempting to write Server Commands to Database...")
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                          commands.forEach(async (command) => {
                            await client.database.writeLog(guild, `Attempting to register Server Command /${command.name} in Database...`)
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            await client.database.getCommand({ name: command.name }, "slash")
                              .then(async (cmd) => {
                                await client.database.addServCmd(guild, {
                                  id: command.id,
                                  cmd_id: cmd.id,
                                  name: cmd.name,
                                  type: "slash"
                                })
                                  .then(async (msg1) => {
                                    await client.database.writeLog(guild, `${msg1} - Searching Database for restrictions...`)
                                      .then(msg2 => client.database.writeDevLog(msg2))
                                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                                    await client.database.getRestriction(command)
                                      .then(async (rests) => {
                                        await server.commands.permissions.set({
                                          token: client.config.token,
                                          permissions: [
                                            {
                                              id: command.id,
                                              permissions: rests
                                            }
                                          ]
                                        })
                                          .then(async () => {
                                            await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                              .then(msg2 => client.database.writeDevLog(msg2))
                                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                                          })
                                          .catch(async (err1) => {
                                            await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                              .then(msg2 => client.database.writeDevLog(msg2))
                                              .catch(err2 => client.database.writeDevLog(`${err2}`));
                                          });
                                      })
                                      .catch(async (err1) => {
                                        await client.database.writeLog(guild, `${err1}`)
                                          .then(msg2 => client.database.writeDevLog(msg2))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      });
                                  })
                                  .catch(async (err1) => {
                                    if (String(err1).includes("Error 409")) {
                                      await client.database.writeLog(guild, `${err1} - Searching Database for restrictions...`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      await client.database.getRestriction(command)
                                        .then(async (rests) => {
                                          await server.commands.permissions.set({
                                            token: client.config.token,
                                            permissions: [
                                              {
                                                id: command.id,
                                                permissions: rests
                                              }
                                            ]
                                          })
                                            .then(async () => {
                                              await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                                            })
                                            .catch(async (err2) => {
                                              await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err3 => client.database.writeDevLog(`${err3}`));
                                            });
                                        })
                                        .catch(async (err2) => {
                                          await client.database.writeLog(guild, `${err2}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                                        });
                                    } else {
                                      await client.database.writeLog(guild, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    }
                                  });
                              })
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          });
                        })
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                    })
                    .catch(async (err) => {
                      client.database.writeDevLog(`${err}`);
                      if (String(err).includes("Error 409")) {
                        await client.database.addLog(guild)
                          .then(async (msg1) => {
                            //Member Registration
                            await client.database.writeLog(guild, msg1)
                              .then(msg2 => client.database.writeDevLog(msg2))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                              .then(msg2 => client.database.writeDevLog(msg2))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            await client.database.getMember(guild)
                              .then(async (users) => {
                                await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                                  .then(msg2 => client.database.writeDevLog(msg2))
                                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                                await users.forEach(async (user) => {
                                  if (!guild.members.cache.get(user.id)) {
                                    await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                      .then(msg2 => client.database.writeDevLog(msg2))
                                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                                    await client.database.remMember(guild, user)
                                      .then(async (msg2) => {
                                        await client.database.writeLog(guild, msg2)
                                          .then(msg3 => client.database.writeDevLog(msg3))
                                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                                      })
                                      .catch(async (err1) => {
                                        await client.database.writeLog(guild, `${err1}`)
                                          .then(msg2 => client.database.writeDevLog(msg2))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      });
                                  } else {
                                    await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                      .then(msg2 => client.database.writeDevLog(msg2))
                                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                                  }
                                });
                              })
                              .catch(async (err1) => {
                                await client.database.writeLog(guild, `${err1} in Database - attempting to add...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                                guild.members.cache.forEach(async (member) => {
                                  if (!member.user.bot) {
                                    await client.database.getMember(guild, member.user)
                                      .then(async () => {
                                        await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      })
                                      .catch(async (err2) => {
                                        if (String(err2).includes("Error 404")) {
                                          await client.database.addMember(guild, member.user)
                                            .then(async (msg1) => {
                                              await client.database.writeLog(guild, msg1)
                                                .then(msg2 => client.database.writeDevLog(msg2))
                                                .catch(err3 => client.database.writeDevLog(`${err3}`));
                                            })
                                            .catch(async (err3) => {
                                              await client.database.writeLog(guild, `${err3}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err4 => client.database.writeDevLog(err4));
                                            });
                                        } else {
                                          await client.database.writeLog(guild, `${err2}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                                        }
                                      });
                                  }
                                });
                              });
                          })
                          .catch(async (err1) => {
                            //Member Registration
                            await client.database.writeLog(guild, `${err1}`)
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err2 => client.database.writeDevLog(`${err2}`));
                            if (String(err1).includes("Error 409")) {
                              await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                              await client.database.getMember(guild)
                                .then(async (users) => {
                                  await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  await users.forEach(async (user) => {
                                    if (!guild.members.cache.get(user.id)) {
                                      await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      await client.database.remMember(guild, user)
                                        .then(async (msg1) => {
                                          await client.database.writeLog(guild, msg1)
                                            .then(msg2 => client.database.writeDevLog(msg2))
                                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                                        })
                                        .catch(async (err2) => {
                                          await client.database.writeLog(guild, `${err2}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                                        });
                                    } else {
                                      await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    }
                                  });
                                })
                                .catch(async (err2) => {
                                  await client.database.writeLog(guild, `${err2} in Database - attempting to add...`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  guild.members.cache.forEach(async (member) => {
                                    if (!member.user.bot) {
                                      await client.database.getMember(guild, member.user)
                                        .then(async () => {
                                          await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                                        })
                                        .catch(async (err3) => {
                                          if (String(err3).includes("Error 404")) {
                                            await client.database.addMember(guild, member.user)
                                              .then(async (msg1) => {
                                                await client.database.writeLog(guild, msg1)
                                                  .then(msg2 => client.database.writeDevLog(msg2))
                                                  .catch(err4 => client.database.writeDevLog(`${err4}`));
                                              })
                                              .catch(async (err4) => {
                                                await client.database.writeLog(guild, `${err4}`)
                                                  .then(msg1 => client.database.writeDevLog(msg1))
                                                  .catch(err5 => client.database.writeDevLog(err5));
                                              });
                                          } else {
                                            await client.database.writeLog(guild, `${err3}`)
                                              .then(msg1 => client.database.writeDevLog(msg1))
                                              .catch(err4 => client.database.writeDevLog(`${err4}`));
                                          }
                                        });
                                    }
                                  });
                                });
                            }
                          });
                        setInterval(async () => {
                          await client.database.getServer(guild)
                            .then(async (server) => {
                              if (server.print_logs) {
                                if (server.log_chan) {
                                  const channel = guild.channels.cache.get(server.log_chan);
                                  await client.database.writeLog(guild, "Printing Logfile...")
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err1 => client.database.writeDevLog(err1));
                                  await client.database.getLog(guild)
                                    .then(async (log) => {
                                      await channel.send({
                                        files: [`./logs/server/${server.id}/${log.id}.log`]
                                      });
                                    })
                                    .catch(async (err1) => await channel.send({
                                      content: `An Error occurred whilst trying to print Logfile:\n${err1}`
                                    }));
                                } else {
                                  await client.database.writeLog(guild, "Error 404: No Log Channel defined")
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                }
                              }
                              await client.database.addLog(guild)
                                .then(async () => {
                                  await client.database.remLog(guild)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                })
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                            })
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                        }, 1000 * 60 * 60 * 24);
                        //Command Registration
                        await client.database.writeLog(guild, "Attempting to register Server Commands...")
                          .then(msg => client.database.writeDevLog(msg))
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                        await server.commands.set(commandArray)
                          .then(async (commands) => {
                            await client.database.writeLog(guild, "Successfully registered Server Commands, attempting to write Server Commands to Database...")
                              .then(msg => client.database.writeDevLog(msg))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            commands.forEach(async (command) => {
                              await client.database.writeLog(guild, `Attempting to register Server Command /${command.name} in Database...`)
                                .then(msg => client.database.writeDevLog(msg))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                              await client.database.getCommand({ name: command.name }, "slash")
                                .then(async (cmd) => {
                                  await client.database.addServCmd(guild, {
                                    id: command.id,
                                    cmd_id: cmd.id,
                                    name: cmd.name,
                                    type: "slash"
                                  })
                                    .then(async (msg) => {
                                      await client.database.writeLog(guild, `${msg} - Searching Database for restrictions...`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                      await client.database.getRestriction(command)
                                        .then(async (rests) => {
                                          await server.commands.permissions.set({
                                            token: client.config.token,
                                            permissions: [
                                              {
                                                id: command.id,
                                                permissions: rests
                                              }
                                            ]
                                          })
                                            .then(async () => {
                                              await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                                            })
                                            .catch(async (err1) => {
                                              await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                                            });
                                        })
                                        .catch(async (err1) => {
                                          await client.database.writeLog(guild, `${err1}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                                        });
                                    })
                                    .catch(async (err1) => {
                                      if (String(err1).includes("Error 409")) {
                                        await client.database.writeLog(guild, `${err1} - Searching Database for restrictions...`)
                                          .then(msg => client.database.writeDevLog(msg))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                        await client.database.getRestriction(command)
                                          .then(async (rests) => {
                                            await server.commands.permissions.set({
                                              token: client.config.token,
                                              permissions: [
                                                {
                                                  id: command.id,
                                                  permissions: rests
                                                }
                                              ]
                                            })
                                              .then(async () => {
                                                await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                                  .then(msg => client.database.writeDevLog(msg))
                                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                                              })
                                              .catch(async (err2) => {
                                                await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                                  .then(msg => client.database.writeDevLog(msg))
                                                  .catch(err3 => client.database.writeDevLog(`${err3}`));
                                              });
                                          })
                                          .catch(async (err2) => {
                                            await client.database.writeLog(guild, `${err2}`)
                                              .then(msg => client.database.writeDevLog(msg))
                                              .catch(err3 => client.database.writeDevLog(`${err3}`));
                                          });
                                      } else {
                                        await client.database.writeLog(guild, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                          .then(msg => client.database.writeDevLog(msg))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      }
                                    });
                                })
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                            });
                          })
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                      }
                    });
                }
              });
          });
        });
      })
      .catch(async (err) => {
        client.database.writeDevLog(`${err} - Attempting to register existing Servers...`);
        if (client.guilds.cache.size === 0) {
          client.database.writeDevLog("Error 404: No Servers found");
        } else {
          client.guilds.cache.forEach(async (server) => {
            const guild = {
              id: server.id,
              name: server.name,
              dm_role: null,
              prefix: client.config.default_prefix
            };
            await client.database.addServer(guild)
              .then(async (msg) => {
                client.database.writeDevLog(msg);
                await client.database.addLog(guild)
                  .then(async (msg1) => {
                    //Member Registration
                    await client.database.writeLog(guild, msg1)
                      .then(msg2 => client.database.writeDevLog(msg2))
                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                    await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                      .then(msg2 => client.database.writeDevLog(msg2))
                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                    await client.database.getMember(guild)
                      .then(async (users) => {
                        await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                          .then(msg2 => client.database.writeDevLog(msg2))
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                        await users.forEach(async (user) => {
                          if (!guild.members.cache.get(user.user_id)) {
                            await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                              .then(msg2 => client.database.writeDevLog(msg2))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                            await client.database.remMember(guild, user)
                              .then(async (msg2) => {
                                await client.database.writeLog(guild, msg2)
                                  .then(msg3 => client.database.writeDevLog(msg3))
                                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                              })
                              .catch(async (err1) => {
                                await client.database.writeLog(guild, `${err1}`)
                                  .then(msg2 => client.database.writeDevLog(msg2))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                              });
                          } else {
                            await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                              .then(msg2 => client.database.writeDevLog(msg2))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          }
                        });
                      })
                      .catch(async (err1) => {
                        await client.database.writeLog(guild, `${err1} in Database - attempting to add...`)
                          .then(msg1 => client.database.writeDevLog(msg1))
                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                        guild.members.cache.forEach(async (member) => {
                          if (!member.user.bot) {
                            await client.database.getMember(guild, member.user)
                              .then(async () => {
                                await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                              })
                              .catch(async (err2) => {
                                if (String(err2).includes("Error 404")) {
                                  await client.database.addMember(guild, member.user)
                                    .then(async (msg1) => {
                                      await client.database.writeLog(guild, msg1)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err3 => client.database.writeDevLog(`${err3}`));
                                    })
                                    .catch(async (err3) => {
                                      await client.database.writeLog(guild, `${err3}`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err4 => client.database.writeDevLog(err4));
                                    });
                                } else {
                                  await client.database.writeLog(guild, `${err2}`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err3 => client.database.writeDevLog(`${err3}`));
                                }
                              });
                          }
                        });
                      });
                  })
                  .catch(async (err1) => {
                    //Member Registration
                    await client.database.writeLog(guild, `${err1}`)
                      .then(msg1 => client.database.writeDevLog(msg1))
                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                    if (String(err1).includes("Error 409")) {
                      await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                        .then(msg1 => client.database.writeDevLog(msg1))
                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                      await client.database.getMember(guild)
                        .then(async (users) => {
                          await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                          await users.forEach(async (user) => {
                            if (!guild.members.cache.get(user.id)) {
                              await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                              await client.database.remMember(guild, user)
                                .then(async (msg1) => {
                                  await client.database.writeLog(guild, msg1)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                })
                                .catch(async (err2) => {
                                  await client.database.writeLog(guild, `${err2}`)
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err3 => client.database.writeDevLog(`${err3}`));
                                });
                            } else {
                              await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                .then(msg1 => client.database.writeDevLog(msg1))
                                .catch(err2 => client.database.writeDevLog(`${err2}`));
                            }
                          });
                        })
                        .catch(async (err2) => {
                          await client.database.writeLog(guild, `${err2} in Database - attempting to add...`)
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                          guild.members.cache.forEach(async (member) => {
                            if (!member.user.bot) {
                              await client.database.getMember(guild, member.user)
                                .then(async () => {
                                  await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err3 => client.database.writeDevLog(`${err3}`));
                                })
                                .catch(async (err3) => {
                                  if (String(err3).includes("Error 404")) {
                                    await client.database.addMember(guild, member.user)
                                      .then(async (msg1) => {
                                        await client.database.writeLog(guild, msg1)
                                          .then(msg2 => client.database.writeDevLog(msg2))
                                          .catch(err4 => client.database.writeDevLog(`${err4}`));
                                      })
                                      .catch(async (err4) => {
                                        await client.database.writeLog(guild, `${err4}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err5 => client.database.writeDevLog(err5));
                                      });
                                  } else {
                                    await client.database.writeLog(guild, `${err3}`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err4 => client.database.writeDevLog(`${err4}`));
                                  }
                                });
                            }
                          });
                        });
                    }
                  });
                setInterval(async () => {
                  await client.database.getServer(guild)
                    .then(async (server) => {
                      if (server.print_logs) {
                        if (server.log_chan) {
                          const channel = guild.channels.cache.get(server.log_chan);
                          await client.database.writeLog(guild, "Printing Logfile...")
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err1 => client.database.writeDevLog(err1));
                          await client.database.getLog(guild)
                            .then(async (log) => {
                              await channel.send({
                                files: [`./logs/server/${server.id}/${log.id}.log`]
                              });
                            })
                            .catch(async (err1) => await channel.send({
                              content: `An Error occurred whilst trying to print Logfile:\n${err1}`
                            }));
                        } else {
                          await client.database.writeLog(guild, "Error 404: No Log Channel defined")
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                        }
                      }
                      await client.database.addLog(guild)
                        .then(async () => {
                          await client.database.remLog(guild)
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                        })
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                    })
                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                }, 1000 * 60 * 60 * 24);
                //Command Registration
                await client.database.writeLog(guild, "Attempting to register Server Commands...")
                  .then(msg1 => client.database.writeDevLog(msg1))
                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                await server.commands.set(commandArray)
                  .then(async (commands) => {
                    await client.database.writeLog(guild, "Successfully registered Server Commands, attempting to write Server Commands to Database...")
                      .then(msg1 => client.database.writeDevLog(msg1))
                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                    commands.forEach(async (command) => {
                      await client.database.writeLog(guild, `Attempting to register Server Command /${command.name} in Database...`)
                        .then(msg1 => client.database.writeDevLog(msg1))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      await client.database.getCommand({ name: command.name }, "slash")
                        .then(async (cmd) => {
                          await client.database.addServCmd(guild, {
                            id: command.id,
                            cmd_id: cmd.id,
                            name: cmd.name,
                            type: "slash"
                          })
                            .then(async (msg1) => {
                              await client.database.writeLog(guild, `${msg1} - Searching Database for restrictions...`)
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                              await client.database.getRestriction(command)
                                .then(async (rests) => {
                                  await server.commands.permissions.set({
                                    token: client.config.token,
                                    permissions: [
                                      {
                                        id: command.id,
                                        permissions: rests
                                      }
                                    ]
                                  })
                                    .then(async () => {
                                      await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                    })
                                    .catch(async (err1) => {
                                      await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                                    });
                                })
                                .catch(async (err1) => {
                                  await client.database.writeLog(guild, `${err1}`)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                });
                            })
                            .catch(async (err1) => {
                              if (String(err1).includes("Error 409")) {
                                await client.database.writeLog(guild, `${err1} - Searching Database for restrictions...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                                await client.database.getRestriction(command)
                                  .then(async (rests) => {
                                    await server.commands.permissions.set({
                                      token: client.config.token,
                                      permissions: [
                                        {
                                          id: command.id,
                                          permissions: rests
                                        }
                                      ]
                                    })
                                      .then(async () => {
                                        await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      })
                                      .catch(async (err2) => {
                                        await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err3 => client.database.writeDevLog(`${err3}`));
                                      });
                                  })
                                  .catch(async (err2) => {
                                    await client.database.writeLog(guild, `${err2}`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  });
                              } else {
                                await client.database.writeLog(guild, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                              }
                            });
                        })
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                    });
                  })
                  .catch(err1 => client.database.writeDevLog(`${err1}`));
              })
              .catch(async (err) => {
                client.database.writeDevLog(`${err}`);
                if (String(err).includes("Error 409")) {
                  await client.database.addLog(guild)
                    .then(async (msg1) => {
                      //Member Registration
                      await client.database.writeLog(guild, msg1)
                        .then(msg2 => client.database.writeDevLog(msg2))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                        .then(msg2 => client.database.writeDevLog(msg2))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      await client.database.getMember(guild)
                        .then(async (users) => {
                          await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                            .then(msg2 => client.database.writeDevLog(msg2))
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                          await users.forEach(async (user) => {
                            if (!guild.members.cache.get(user.id)) {
                              await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                              await client.database.remMember(guild, user)
                                .then(async (msg2) => {
                                  await client.database.writeLog(guild, msg2)
                                    .then(msg3 => client.database.writeDevLog(msg3))
                                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                                })
                                .catch(async (err1) => {
                                  await client.database.writeLog(guild, `${err1}`)
                                    .then(msg2 => client.database.writeDevLog(msg2))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                });
                            } else {
                              await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                            }
                          });
                        })
                        .catch(async (err1) => {
                          await client.database.writeLog(guild, `${err1} in Database - attempting to add...`)
                            .then(msg1 => client.database.writeDevLog(msg1))
                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                          guild.members.cache.forEach(async (member) => {
                            if (!member.user.bot) {
                              await client.database.getMember(guild, member.user)
                                .then(async () => {
                                  await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                    .then(msg1 => client.database.writeDevLog(msg1))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                })
                                .catch(async (err2) => {
                                  if (String(err2).includes("Error 404")) {
                                    await client.database.addMember(guild, member.user)
                                      .then(async (msg1) => {
                                        await client.database.writeLog(guild, msg1)
                                          .then(msg2 => client.database.writeDevLog(msg2))
                                          .catch(err3 => client.database.writeDevLog(`${err3}`));
                                      })
                                      .catch(async (err3) => {
                                        await client.database.writeLog(guild, `${err3}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err4 => client.database.writeDevLog(err4));
                                      });
                                  } else {
                                    await client.database.writeLog(guild, `${err2}`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  }
                                });
                            }
                          });
                        });
                    })
                    .catch(async (err1) => {
                      //Member Registration
                      await client.database.writeLog(guild, `${err1}`)
                        .then(msg1 => client.database.writeDevLog(msg1))
                        .catch(err2 => client.database.writeDevLog(`${err2}`));
                      if (String(err1).includes("Error 409")) {
                        await client.database.writeLog(guild, "Beginning Member registration - Searching Database for Members...")
                          .then(msg1 => client.database.writeDevLog(msg1))
                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                        await client.database.getMember(guild)
                          .then(async (users) => {
                            await client.database.writeLog(guild, "Found Members in Database, checking if they exist on the Server...")
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err2 => client.database.writeDevLog(`${err2}`));
                            await users.forEach(async (user) => {
                              if (!guild.members.cache.get(user.id)) {
                                await client.database.writeLog(guild, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                                await client.database.remMember(guild, user)
                                  .then(async (msg1) => {
                                    await client.database.writeLog(guild, msg1)
                                      .then(msg2 => client.database.writeDevLog(msg2))
                                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  })
                                  .catch(async (err2) => {
                                    await client.database.writeLog(guild, `${err2}`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  });
                              } else {
                                await client.database.writeLog(guild, `Found Member \"${user.name}\" in Server - Skipping...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err2 => client.database.writeDevLog(`${err2}`));
                              }
                            });
                          })
                          .catch(async (err2) => {
                            await client.database.writeLog(guild, `${err2} in Database - attempting to add...`)
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err3 => client.database.writeDevLog(`${err3}`));
                            guild.members.cache.forEach(async (member) => {
                              if (!member.user.bot) {
                                await client.database.getMember(guild, member.user)
                                  .then(async () => {
                                    await client.database.writeLog(guild, "Error 409: Duplicate Server Member")
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err3 => client.database.writeDevLog(`${err3}`));
                                  })
                                  .catch(async (err3) => {
                                    if (String(err3).includes("Error 404")) {
                                      await client.database.addMember(guild, member.user)
                                        .then(async (msg1) => {
                                          await client.database.writeLog(guild, msg1)
                                            .then(msg2 => client.database.writeDevLog(msg2))
                                            .catch(err4 => client.database.writeDevLog(`${err4}`));
                                        })
                                        .catch(async (err4) => {
                                          await client.database.writeLog(guild, `${err4}`)
                                            .then(msg1 => client.database.writeDevLog(msg1))
                                            .catch(err5 => client.database.writeDevLog(err5));
                                        });
                                    } else {
                                      await client.database.writeLog(guild, `${err3}`)
                                        .then(msg1 => client.database.writeDevLog(msg1))
                                        .catch(err4 => client.database.writeDevLog(`${err4}`));
                                    }
                                  });
                              }
                            });
                          });
                      }
                    });
                  setInterval(async () => {
                    await client.database.getServer(guild)
                      .then(async (server) => {
                        if (server.print_logs) {
                          if (server.log_chan) {
                            const channel = guild.channels.cache.get(server.log_chan);
                            await client.database.writeLog(guild, "Printing Logfile...")
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err1 => client.database.writeDevLog(err1));
                            await client.database.getLog(guild)
                              .then(async (log) => {
                                await channel.send({
                                  files: [`./logs/server/${server.id}/${log.id}.log`]
                                });
                              })
                              .catch(async (err1) => await channel.send({
                                content: `An Error occurred whilst trying to print Logfile:\n${err1}`
                              }));
                          } else {
                            await client.database.writeLog(guild, "Error 404: No Log Channel defined")
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          }
                        }
                        await client.database.addLog(guild)
                          .then(async () => {
                            await client.database.remLog(guild)
                              .then(msg1 => client.database.writeDevLog(msg1))
                              .catch(err1 => client.database.writeDevLog(`${err1}`));
                          })
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                      })
                      .catch(err1 => client.database.writeDevLog(`${err1}`));
                  }, 1000 * 60 * 60 * 24);
                  //Command Registration
                  await client.database.writeLog(guild, "Attempting to register Server Commands...")
                    .then(msg => client.database.writeDevLog(msg))
                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                  await server.commands.set(commandArray)
                    .then(async (commands) => {
                      await client.database.writeLog(guild, "Successfully registered Server Commands, attempting to write Server Commands to Database...")
                        .then(msg => client.database.writeDevLog(msg))
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                      commands.forEach(async (command) => {
                        await client.database.writeLog(guild, `Attempting to register Server Command /${command.name} in Database...`)
                          .then(msg => client.database.writeDevLog(msg))
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                        await client.database.getCommand({ name: command.name }, "slash")
                          .then(async (cmd) => {
                            await client.database.addServCmd(guild, {
                              id: command.id,
                              cmd_id: cmd.id,
                              name: cmd.name,
                              type: "slash"
                            })
                              .then(async (msg) => {
                                await client.database.writeLog(guild, `${msg} - Searching Database for restrictions...`)
                                  .then(msg1 => client.database.writeDevLog(msg1))
                                  .catch(err1 => client.database.writeDevLog(`${err1}`));
                                await client.database.getRestriction(command)
                                  .then(async (rests) => {
                                    await server.commands.permissions.set({
                                      token: client.config.token,
                                      permissions: [
                                        {
                                          id: command.id,
                                          permissions: rests
                                        }
                                      ]
                                    })
                                      .then(async () => {
                                        await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                                      })
                                      .catch(async (err1) => {
                                        await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                          .then(msg1 => client.database.writeDevLog(msg1))
                                          .catch(err2 => client.database.writeDevLog(`${err2}`));
                                      });
                                  })
                                  .catch(async (err1) => {
                                    await client.database.writeLog(guild, `${err1}`)
                                      .then(msg1 => client.database.writeDevLog(msg1))
                                      .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  });
                              })
                              .catch(async (err1) => {
                                if (String(err1).includes("Error 409")) {
                                  await client.database.writeLog(guild, `${err1} - Searching Database for restrictions...`)
                                    .then(msg => client.database.writeDevLog(msg))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                  await client.database.getRestriction(command)
                                    .then(async (rests) => {
                                      await server.commands.permissions.set({
                                        token: client.config.token,
                                        permissions: [
                                          {
                                            id: command.id,
                                            permissions: rests
                                          }
                                        ]
                                      })
                                        .then(async () => {
                                          await client.database.writeLog(guild, `Successfully added restrictions to Command /${command.name}`)
                                            .then(msg => client.database.writeDevLog(msg))
                                            .catch(err2 => client.database.writeDevLog(`${err2}`));
                                        })
                                        .catch(async (err2) => {
                                          await client.database.writeLog(guild, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                            .then(msg => client.database.writeDevLog(msg))
                                            .catch(err3 => client.database.writeDevLog(`${err3}`));
                                        });
                                    })
                                    .catch(async (err2) => {
                                      await client.database.writeLog(guild, `${err2}`)
                                        .then(msg => client.database.writeDevLog(msg))
                                        .catch(err3 => client.database.writeDevLog(`${err3}`));
                                    });
                                } else {
                                  await client.database.writeLog(guild, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                    .then(msg => client.database.writeDevLog(msg))
                                    .catch(err2 => client.database.writeDevLog(`${err2}`));
                                }
                              });
                          })
                          .catch(err1 => client.database.writeDevLog(`${err1}`));
                      });
                    })
                    .catch(err1 => client.database.writeDevLog(`${err1}`));
                }
              });
          });
        }
      });
  }
}
export default new Event();