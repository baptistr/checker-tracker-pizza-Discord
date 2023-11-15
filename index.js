import { Client, ActionRowBuilder, SlashCommandBuilder, GatewayIntentBits } from 'discord.js';
import { readFileSync, writeFileSync, existsSync, closeSync, openSync } from 'fs';
import { schedule } from "node-cron";
import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import { requestPeoplePizza } from './helpers.js';

const {
    token,
    channel,
    pathPeoplePizza,
    pathPizzaList,
    applicationId
} = process.env;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    let request, res;

    switch (commandName) {
        case 'createpizzacommand':
            request = readFileSync(pathPeoplePizza, 'utf-8');

            if (!request) {
                writeFileSync(pathPeoplePizza, JSON.stringify([]));
                await interaction.reply(":white_check_mark: :white_check_mark: L'initialisation de la commande de pizza a été créée :white_check_mark: :white_check_mark:\n:pizza: :pizza: Pour vous inscrire, tapez **/addMe** :pizza: :pizza:");
                return;
            }

            await interaction.reply(`
                :x: :x: La commande de pizza a déjà été créée :x: :x: 
                Si vous voulez supprimer la commande de pizza, tapez **/deletePizzaCommand**
            `);

            break;
        case 'addme':
            request = readFileSync(pathPeoplePizza, 'utf-8');

            if (!request) {
                await interaction.reply(":x: :x: La commande de pizza n'a pas été créée :x: :x:\nPour créer la commande de pizza, tapez **/createPizzaCommand**");
                return;
            }

            res = JSON.parse(request);

            const exist = res.some((elem) => elem.user === interaction.user.tag);

            if (!exist) {
                res.push({
                    user: interaction.user.tag,
                    pizza: []
                });

                writeFileSync(pathPeoplePizza, JSON.stringify(res));
                await interaction.reply(":white_check_mark: :white_check_mark: @" + interaction.user.tag + " a été ajouté à la liste pour la commande de pizzas d'aujourd'hui :white_check_mark: :white_check_mark: ");

            } else {
                await interaction.reply(":x: :x: @" + interaction.user.tag + " est déjà dans la pour la commande d'aujourd'hui. :x: :x: ");
            }

            break;
        case 'delme':
            res = await requestPeoplePizza(pathPeoplePizza, interaction);
            if (!res) return;

            const index = res.findIndex((elem) => elem.user === interaction.user.tag);

            if (index !== -1) {
                res.splice(index, 1);
                writeFileSync(pathPeoplePizza, JSON.stringify(res));
                await interaction.reply(":white_check_mark: :white_check_mark: @" + interaction.user.tag + " a été supprimé de la liste pour la commande de pizzas d'aujourd'hui :white_check_mark: :white_check_mark: ");
            } else {
                await interaction.reply(":x: :x: @" + interaction.user.tag + " n'est pas dans la liste pour la commande d'aujourd'hui. :x: :x: ");
            }

            break;
        case 'listpeople':
            res = await requestPeoplePizza(pathPeoplePizza, interaction);
            if (!res) return;

            let list = '';

            res.forEach((elem) => {
                list += `- ${elem.user}\n`
            });

            list += `**il y a ${res.length} personne(s) dans la liste.**`;

            await interaction.reply(list);

            break;
        case 'deletepizzacommand':
            writeFileSync(pathPeoplePizza, JSON.stringify());

            break;
        case 'listpizza':
            request = readFileSync(pathPizzaList, 'utf-8');

            if (!request) {
                await interaction.reply(":x: :x: Aucune pizza existe :x: :x:");
                return;
            }

            res = JSON.parse(request);

            const embedListPizza = {
                "title": "Liste des pizzas",
                "description": "Voici la liste des pizzas disponibles",
                "color": 16711680,
                "fields": []
            };

            res.forEach((elem) => {
                embedListPizza.fields.push({
                    "name": elem.nom,
                    "value": elem.contenance
                });
            });

            await interaction.reply({ embeds: [embedListPizza] });

            break;
        case 'helpcommands':
            const embed = {
                "title": "Liste des commandes",
                "description": "Voici la liste des commandes disponibles",
                "color": 16711680,
                "fields": [
                    {
                        "name": "/addMe",
                        "value": "Ajouter votre nom à la liste des personnes qui participent à la commande de pizza"
                    },
                    {
                        "name": "/delMe",
                        "value": "Supprimer votre nom de la liste des personnes qui participent à la commande de pizza"
                    },
                    {
                        "name": "/listPeople",
                        "value": "Lister les personnes qui participent à la commande de pizza"
                    },
                    {
                        "name": "/createPizzaCommand",
                        "value": "Créer la commande de pizza"
                    },
                    {
                        "name": "/deletePizzaCommand",
                        "value": "Supprimer la commande de pizza"
                    },
                    {
                        "name": "/listPizza",
                        "value": "Lister les pizzas"
                    },
                    {
                        "name": "/helpCommands",
                        "value": "Lister les commandes"
                    }
                ]
            };

            await interaction.reply({ embeds: [embed] });

            break;
        default:
            interaction.reply("Commande inconnue");

            break;
    }
});

const onReady = async () => {
    //creation des fichiers .json
    if (!existsSync(pathPeoplePizza)) {
        closeSync(openSync(pathPeoplePizza, 'w'))
        console.log(`${pathPeoplePizza} people-pizza.json created.`);
    }

    if (!existsSync(pathPizzaList)) {
        closeSync(openSync(pathPizzaList, 'w'))
        console.log(`${pathPizzaList} pizza-list.json created.`);
    }

    const commands = [
        new SlashCommandBuilder()
            .setName('addme')
            .setDescription("Participer à la prochaine commande de pizza"),
        new SlashCommandBuilder()
            .setName('delme')
            .setDescription("Se désinscrire de la prochaine commande de pizza"),
        new SlashCommandBuilder()
            .setName('listpeople')
            .setDescription("Liste les personnes qui participent à la commande de pizza"),
        new SlashCommandBuilder()
            .setName('createpizzacommand')
            .setDescription("Créer la commande de pizza"),
        new SlashCommandBuilder()
            .setName('deletepizzacommand')
            .setDescription("Supprimer la commande de pizza"),
        new SlashCommandBuilder()
            .setName('listpizza')
            .setDescription("liste les pizzas"),
        new SlashCommandBuilder()
            .setName('helpcommands')
            .setDescription("Liste les commandes")
    ]
        .map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(token);

    await rest.put(Routes.applicationCommands(applicationId), { body: commands })
        .then(() => console.log('Commands registered.'))
        .catch(console.error);

    console.log("Je suis prêt à établir votre commande !");
}

client.on("ready", onReady);
client.login(token);