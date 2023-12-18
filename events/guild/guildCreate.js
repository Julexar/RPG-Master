import { client } from '../../index.js';
class Event {
    constructor() {
        this.name = 'guildCreate';
    }
    /**
     *
     * @param {import("discord.js").Guild} guild
     */
    async run(guild) {
        const commandArray = client.slashCommands;
        const server = {
            id: guild.id,
            name: guild.name,
            dm_role: null,
            prefix: client.config.default_prefix,
        };
        await client.database
            .addServer(server)
            .then(async (msg) => {
                client.database.writeDevLog(msg);
                await client.database
                    .addLog(server)
                    .then(async (msg1) => {
                        //Member Registration
                        await client.database
                            .writeLog(server, msg1)
                            .then((msg2) => client.database.writeDevLog(msg2))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        await client.database
                            .writeLog(server, 'Beginning Member registration - Searching Database for Members...')
                            .then((msg2) => client.database.writeDevLog(msg2))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        await client.database
                            .getMember(server)
                            .then(async (users) => {
                                await client.database
                                    .writeLog(server, 'Found Members in Database, checking if they exist on the Server...')
                                    .then((msg2) => client.database.writeDevLog(msg2))
                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                await users.forEach(async (user) => {
                                    if (!server.members.cache.get(user.id)) {
                                        await client.database
                                            .writeLog(server, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                            .then((msg2) => client.database.writeDevLog(msg2))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        await client.database
                                            .remMember(server, user)
                                            .then(async (msg2) => {
                                                await client.database
                                                    .writeLog(server, msg2)
                                                    .then((msg3) => client.database.writeDevLog(msg3))
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            })
                                            .catch(async (err1) => {
                                                await client.database
                                                    .writeLog(server, `${err1}`)
                                                    .then((msg2) => client.database.writeDevLog(msg2))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                            });
                                    } else {
                                        await client.database
                                            .writeLog(server, `Found Member \"${user.name}\" in Server - Skipping...`)
                                            .then((msg2) => client.database.writeDevLog(msg2))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                    }
                                });
                            })
                            .catch(async (err1) => {
                                await client.database
                                    .writeLog(server, `${err1} in Database - attempting to add...`)
                                    .then((msg1) => client.database.writeDevLog(msg1))
                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                server.members.cache.forEach(async (member) => {
                                    if (!member.user.bot) {
                                        await client.database
                                            .getMember(server, member.user)
                                            .then(async () => {
                                                await client.database
                                                    .writeLog(server, 'Error 409: Duplicate Server Member')
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                            })
                                            .catch(async (err2) => {
                                                if (String(err2).includes('Error 404')) {
                                                    await client.database
                                                        .addMember(server, member.user)
                                                        .then(async (msg1) => {
                                                            await client.database
                                                                .writeLog(server, msg1)
                                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                                .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                        })
                                                        .catch(async (err3) => {
                                                            await client.database
                                                                .writeLog(server, `${err3}`)
                                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                                .catch((err4) => client.database.writeDevLog(err4));
                                                        });
                                                } else {
                                                    await client.database
                                                        .writeLog(server, `${err2}`)
                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                        .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                }
                                            });
                                    }
                                });
                            });
                    })
                    .catch(async (err1) => {
                        //Member Registration
                        await client.database
                            .writeLog(server, `${err1}`)
                            .then((msg1) => client.database.writeDevLog(msg1))
                            .catch((err2) => client.database.writeDevLog(`${err2}`));
                        if (String(err1).includes('Error 409')) {
                            await client.database
                                .writeLog(server, 'Beginning Member registration - Searching Database for Members...')
                                .then((msg1) => client.database.writeDevLog(msg1))
                                .catch((err2) => client.database.writeDevLog(`${err2}`));
                            await client.database
                                .getMember(server)
                                .then(async (users) => {
                                    await client.database
                                        .writeLog(server, 'Found Members in Database, checking if they exist on the Server...')
                                        .then((msg1) => client.database.writeDevLog(msg1))
                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                    await users.forEach(async (user) => {
                                        if (!server.members.cache.get(user.id)) {
                                            await client.database
                                                .writeLog(server, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                .catch((err2) => client.database.writeDevLog(`${err2}`));
                                            await client.database
                                                .remMember(server, user)
                                                .then(async (msg1) => {
                                                    await client.database
                                                        .writeLog(server, msg1)
                                                        .then((msg2) => client.database.writeDevLog(msg2))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                })
                                                .catch(async (err2) => {
                                                    await client.database
                                                        .writeLog(server, `${err2}`)
                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                        .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                });
                                        } else {
                                            await client.database
                                                .writeLog(server, `Found Member \"${user.name}\" in Server - Skipping...`)
                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                .catch((err2) => client.database.writeDevLog(`${err2}`));
                                        }
                                    });
                                })
                                .catch(async (err2) => {
                                    await client.database
                                        .writeLog(server, `${err2} in Database - attempting to add...`)
                                        .then((msg1) => client.database.writeDevLog(msg1))
                                        .catch((err3) => client.database.writeDevLog(`${err3}`));
                                    server.members.cache.forEach(async (member) => {
                                        if (!member.user.bot) {
                                            await client.database
                                                .getMember(server, member.user)
                                                .then(async () => {
                                                    await client.database
                                                        .writeLog(server, 'Error 409: Duplicate Server Member')
                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                        .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                })
                                                .catch(async (err3) => {
                                                    if (String(err3).includes('Error 404')) {
                                                        await client.database
                                                            .addMember(server, member.user)
                                                            .then(async (msg1) => {
                                                                await client.database
                                                                    .writeLog(server, msg1)
                                                                    .then((msg2) => client.database.writeDevLog(msg2))
                                                                    .catch((err4) => client.database.writeDevLog(`${err4}`));
                                                            })
                                                            .catch(async (err4) => {
                                                                await client.database
                                                                    .writeLog(server, `${err4}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err5) => client.database.writeDevLog(err5));
                                                            });
                                                    } else {
                                                        await client.database
                                                            .writeLog(server, `${err3}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err4) => client.database.writeDevLog(`${err4}`));
                                                    }
                                                });
                                        }
                                    });
                                });
                        }
                    });
                setInterval(
                    async () => {
                        await client.database
                            .getServer(server)
                            .then(async (server) => {
                                if (server.print_logs) {
                                    if (server.log_chan) {
                                        const channel = server.channels.cache.get(server.log_chan);
                                        await client.database
                                            .writeLog(server, 'Printing Logfile...')
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err1) => client.database.writeDevLog(err1));
                                        await client.database
                                            .getLog(server)
                                            .then(async (log) => {
                                                await channel.send({
                                                    files: [`./logs/server/${server.id}/${log.id}.log`],
                                                });
                                            })
                                            .catch(
                                                async (err1) =>
                                                    await channel.send({
                                                        content: `An Error occurred whilst trying to print Logfile:\n${err1}`,
                                                    })
                                            );
                                    } else {
                                        await client.database
                                            .writeLog(server, 'Error 404: No Log Channel defined')
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                    }
                                }
                                await client.database
                                    .addLog(server)
                                    .then(async () => {
                                        await client.database
                                            .remLog(server)
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                    })
                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    },
                    1000 * 60 * 60 * 24
                );
                //Command Registration
                await client.database
                    .writeLog(server, 'Attempting to register Server Commands...')
                    .then((msg1) => client.database.writeDevLog(msg1))
                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                await guild.commands
                    .set(commandArray)
                    .then(async (commands) => {
                        await client.database
                            .writeLog(server, 'Successfully registered Server Commands, attempting to write Server Commands to Database...')
                            .then((msg1) => client.database.writeDevLog(msg1))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        commands.forEach(async (command) => {
                            await client.database
                                .writeLog(server, `Attempting to register Server Command /${command.name} in Database...`)
                                .then((msg1) => client.database.writeDevLog(msg1))
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                            await client.database
                                .getCommand({ name: command.name }, 'slash')
                                .then(async (cmd) => {
                                    await client.database
                                        .addServCmd(server, {
                                            id: command.id,
                                            cmd_id: cmd.id,
                                            name: cmd.name,
                                            type: 'slash',
                                        })
                                        .then(async (msg1) => {
                                            await client.database
                                                .writeLog(server, `${msg1} - Searching Database for restrictions...`)
                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            await client.database
                                                .getRestriction(command)
                                                .then(async (rests) => {
                                                    await server.commands.permissions
                                                        .set({
                                                            token: client.config.token,
                                                            permissions: [
                                                                {
                                                                    id: command.id,
                                                                    permissions: rests,
                                                                },
                                                            ],
                                                        })
                                                        .then(async () => {
                                                            await client.database
                                                                .writeLog(server, `Successfully added restrictions to Command /${command.name}`)
                                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                        })
                                                        .catch(async (err1) => {
                                                            await client.database
                                                                .writeLog(server, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                                .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                        });
                                                })
                                                .catch(async (err1) => {
                                                    await client.database
                                                        .writeLog(server, `${err1}`)
                                                        .then((msg2) => client.database.writeDevLog(msg2))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                });
                                        })
                                        .catch(async (err1) => {
                                            if (String(err1).includes('Error 409')) {
                                                await client.database
                                                    .writeLog(server, `${err1} - Searching Database for restrictions...`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                await client.database
                                                    .getRestriction(command)
                                                    .then(async (rests) => {
                                                        await server.commands.permissions
                                                            .set({
                                                                token: client.config.token,
                                                                permissions: [
                                                                    {
                                                                        id: command.id,
                                                                        permissions: rests,
                                                                    },
                                                                ],
                                                            })
                                                            .then(async () => {
                                                                await client.database
                                                                    .writeLog(server, `Successfully added restrictions to Command /${command.name}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                            })
                                                            .catch(async (err2) => {
                                                                await client.database
                                                                    .writeLog(server, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                            });
                                                    })
                                                    .catch(async (err2) => {
                                                        await client.database
                                                            .writeLog(server, `${err2}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                    });
                                            } else {
                                                await client.database
                                                    .writeLog(server, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                            }
                                        });
                                })
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                        });
                    })
                    .catch((err1) => client.database.writeDevLog(`${err1}`));
            })
            .catch(async (err) => {
                client.database.writeDevLog(`${err}`);
                if (String(err).includes('Error 409')) {
                    await client.database
                        .addLog(server)
                        .then(async (msg1) => {
                            //Member Registration
                            await client.database
                                .writeLog(server, msg1)
                                .then((msg2) => client.database.writeDevLog(msg2))
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                            await client.database
                                .writeLog(server, 'Beginning Member registration - Searching Database for Members...')
                                .then((msg2) => client.database.writeDevLog(msg2))
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                            await client.database
                                .getMember(server)
                                .then(async (users) => {
                                    await client.database
                                        .writeLog(server, 'Found Members in Database, checking if they exist on the Server...')
                                        .then((msg2) => client.database.writeDevLog(msg2))
                                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                                    await users.forEach(async (user) => {
                                        if (!server.members.cache.get(user.id)) {
                                            await client.database
                                                .writeLog(server, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            await client.database
                                                .remMember(server, user)
                                                .then(async (msg2) => {
                                                    await client.database
                                                        .writeLog(server, msg2)
                                                        .then((msg3) => client.database.writeDevLog(msg3))
                                                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                })
                                                .catch(async (err1) => {
                                                    await client.database
                                                        .writeLog(server, `${err1}`)
                                                        .then((msg2) => client.database.writeDevLog(msg2))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                });
                                        } else {
                                            await client.database
                                                .writeLog(server, `Found Member \"${user.name}\" in Server - Skipping...`)
                                                .then((msg2) => client.database.writeDevLog(msg2))
                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        }
                                    });
                                })
                                .catch(async (err1) => {
                                    await client.database
                                        .writeLog(server, `${err1} in Database - attempting to add...`)
                                        .then((msg1) => client.database.writeDevLog(msg1))
                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                    server.members.cache.forEach(async (member) => {
                                        if (!member.user.bot) {
                                            await client.database
                                                .getMember(server, member.user)
                                                .then(async () => {
                                                    await client.database
                                                        .writeLog(server, 'Error 409: Duplicate Server Member')
                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                })
                                                .catch(async (err2) => {
                                                    if (String(err2).includes('Error 404')) {
                                                        await client.database
                                                            .addMember(server, member.user)
                                                            .then(async (msg1) => {
                                                                await client.database
                                                                    .writeLog(server, msg1)
                                                                    .then((msg2) => client.database.writeDevLog(msg2))
                                                                    .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                            })
                                                            .catch(async (err3) => {
                                                                await client.database
                                                                    .writeLog(server, `${err3}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err4) => client.database.writeDevLog(err4));
                                                            });
                                                    } else {
                                                        await client.database
                                                            .writeLog(server, `${err2}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                    }
                                                });
                                        }
                                    });
                                });
                        })
                        .catch(async (err1) => {
                            //Member Registration
                            await client.database
                                .writeLog(server, `${err1}`)
                                .then((msg1) => client.database.writeDevLog(msg1))
                                .catch((err2) => client.database.writeDevLog(`${err2}`));
                            if (String(err1).includes('Error 409')) {
                                await client.database
                                    .writeLog(server, 'Beginning Member registration - Searching Database for Members...')
                                    .then((msg1) => client.database.writeDevLog(msg1))
                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                await client.database
                                    .getMember(server)
                                    .then(async (users) => {
                                        await client.database
                                            .writeLog(server, 'Found Members in Database, checking if they exist on the Server...')
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err2) => client.database.writeDevLog(`${err2}`));
                                        await users.forEach(async (user) => {
                                            if (!server.members.cache.get(user.id)) {
                                                await client.database
                                                    .writeLog(server, `Could not find \"${user.name}\" in the Server - Removing from Database...`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                await client.database
                                                    .remMember(server, user)
                                                    .then(async (msg1) => {
                                                        await client.database
                                                            .writeLog(server, msg1)
                                                            .then((msg2) => client.database.writeDevLog(msg2))
                                                            .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                    })
                                                    .catch(async (err2) => {
                                                        await client.database
                                                            .writeLog(server, `${err2}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                    });
                                            } else {
                                                await client.database
                                                    .writeLog(server, `Found Member \"${user.name}\" in Server - Skipping...`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                            }
                                        });
                                    })
                                    .catch(async (err2) => {
                                        await client.database
                                            .writeLog(server, `${err2} in Database - attempting to add...`)
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err3) => client.database.writeDevLog(`${err3}`));
                                        server.members.cache.forEach(async (member) => {
                                            if (!member.user.bot) {
                                                await client.database
                                                    .getMember(server, member.user)
                                                    .then(async () => {
                                                        await client.database
                                                            .writeLog(server, 'Error 409: Duplicate Server Member')
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                    })
                                                    .catch(async (err3) => {
                                                        if (String(err3).includes('Error 404')) {
                                                            await client.database
                                                                .addMember(server, member.user)
                                                                .then(async (msg1) => {
                                                                    await client.database
                                                                        .writeLog(server, msg1)
                                                                        .then((msg2) => client.database.writeDevLog(msg2))
                                                                        .catch((err4) => client.database.writeDevLog(`${err4}`));
                                                                })
                                                                .catch(async (err4) => {
                                                                    await client.database
                                                                        .writeLog(server, `${err4}`)
                                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                                        .catch((err5) => client.database.writeDevLog(err5));
                                                                });
                                                        } else {
                                                            await client.database
                                                                .writeLog(server, `${err3}`)
                                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                                .catch((err4) => client.database.writeDevLog(`${err4}`));
                                                        }
                                                    });
                                            }
                                        });
                                    });
                            }
                        });
                    setInterval(
                        async () => {
                            await client.database
                                .getServer(server)
                                .then(async (server) => {
                                    if (server.print_logs) {
                                        if (server.log_chan) {
                                            const channel = server.channels.cache.get(server.log_chan);
                                            await client.database
                                                .writeLog(server, 'Printing Logfile...')
                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                .catch((err1) => client.database.writeDevLog(err1));
                                            await client.database
                                                .getLog(server)
                                                .then(async (log) => {
                                                    await channel.send({
                                                        files: [`./logs/server/${server.id}/${log.id}.log`],
                                                    });
                                                })
                                                .catch(
                                                    async (err1) =>
                                                        await channel.send({
                                                            content: `An Error occurred whilst trying to print Logfile:\n${err1}`,
                                                        })
                                                );
                                        } else {
                                            await client.database
                                                .writeLog(server, 'Error 404: No Log Channel defined')
                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        }
                                    }
                                    await client.database
                                        .addLog(server)
                                        .then(async () => {
                                            await client.database
                                                .remLog(server)
                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        })
                                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                                })
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                        },
                        1000 * 60 * 60 * 24
                    );
                    //Command Registration
                    await client.database
                        .writeLog(server, 'Attempting to register Server Commands...')
                        .then((msg) => client.database.writeDevLog(msg))
                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                    await server.commands
                        .set(commandArray)
                        .then(async (commands) => {
                            await client.database
                                .writeLog(server, 'Successfully registered Server Commands, attempting to write Server Commands to Database...')
                                .then((msg) => client.database.writeDevLog(msg))
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                            commands.forEach(async (command) => {
                                await client.database
                                    .writeLog(server, `Attempting to register Server Command /${command.name} in Database...`)
                                    .then((msg) => client.database.writeDevLog(msg))
                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                await client.database
                                    .getCommand({ name: command.name }, 'slash')
                                    .then(async (cmd) => {
                                        await client.database
                                            .addServCmd(server, {
                                                id: command.id,
                                                cmd_id: cmd.id,
                                                name: cmd.name,
                                                type: 'slash',
                                            })
                                            .then(async (msg) => {
                                                await client.database
                                                    .writeLog(server, `${msg} - Searching Database for restrictions...`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                await client.database
                                                    .getRestriction(command)
                                                    .then(async (rests) => {
                                                        await server.commands.permissions
                                                            .set({
                                                                token: client.config.token,
                                                                permissions: [
                                                                    {
                                                                        id: command.id,
                                                                        permissions: rests,
                                                                    },
                                                                ],
                                                            })
                                                            .then(async () => {
                                                                await client.database
                                                                    .writeLog(server, `Successfully added restrictions to Command /${command.name}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                            })
                                                            .catch(async (err1) => {
                                                                await client.database
                                                                    .writeLog(server, `Failed to add restrictions to Command /${command.name}\nReason:\n${err1}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                            });
                                                    })
                                                    .catch(async (err1) => {
                                                        await client.database
                                                            .writeLog(server, `${err1}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                    });
                                            })
                                            .catch(async (err1) => {
                                                if (String(err1).includes('Error 409')) {
                                                    await client.database
                                                        .writeLog(server, `${err1} - Searching Database for restrictions...`)
                                                        .then((msg) => client.database.writeDevLog(msg))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                    await client.database
                                                        .getRestriction(command)
                                                        .then(async (rests) => {
                                                            await server.commands.permissions
                                                                .set({
                                                                    token: client.config.token,
                                                                    permissions: [
                                                                        {
                                                                            id: command.id,
                                                                            permissions: rests,
                                                                        },
                                                                    ],
                                                                })
                                                                .then(async () => {
                                                                    await client.database
                                                                        .writeLog(server, `Successfully added restrictions to Command /${command.name}`)
                                                                        .then((msg) => client.database.writeDevLog(msg))
                                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                                })
                                                                .catch(async (err2) => {
                                                                    await client.database
                                                                        .writeLog(server, `Failed to add restrictions to Command /${command.name}\nReason:\n${err2}`)
                                                                        .then((msg) => client.database.writeDevLog(msg))
                                                                        .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                                });
                                                        })
                                                        .catch(async (err2) => {
                                                            await client.database
                                                                .writeLog(server, `${err2}`)
                                                                .then((msg) => client.database.writeDevLog(msg))
                                                                .catch((err3) => client.database.writeDevLog(`${err3}`));
                                                        });
                                                } else {
                                                    await client.database
                                                        .writeLog(server, `Failed to register Server Command /${command.name}\nReason:\n${err1}`)
                                                        .then((msg) => client.database.writeDevLog(msg))
                                                        .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                }
                                            });
                                    })
                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                            });
                        })
                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                }
            });
    }
}
export default new Event();
