import { Client, ButtonBuilder, ActionRowBuilder, SlashCommandBuilder, GatewayIntentBits, ButtonStyle } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { schedule } from "node-cron";
import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import { requestPeoplePizza } from './helpers.js';

const {
    token,
    channel,
    pathPeoplePizza,
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
                res.push([]);
                await interaction.reply(`
                    :white_check_mark: :white_check_mark: L'initialisation de la commande de pizza a été créée :white_check_mark: :white_check_mark:
                    :pizza: :pizza: Pour vous inscrire, tapez **/addMe** :pizza: :pizza: 
                `);
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
                list += elem.user + '\n';
            });

            list += `**il y a ${res.length} personnes dans la liste.**`;

            await interaction.reply(list);

            break;
        case 'deletepizzacommand':
            writeFileSync(pathPeoplePizza, JSON.stringify());

            break;
    }
});

const onReady = async () => {
    if (!existsSync(pathPeoplePizza)) {
        //creation des fichiers .json
        writeFileSync(pathPeoplePizza, JSON.stringify([]));
        console.log(`${pathPeoplePizza} people-pizza.json created.`);
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
            .setDescription("liste les pizzas")
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