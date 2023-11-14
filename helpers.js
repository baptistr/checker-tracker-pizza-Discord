export const requestPeoplePizza = async (path, interaction) => {
    const request = readFileSync(pathPeoplePizza);

    if (!request) {
        await interaction.reply(`
                    :x: :x: La commande de pizza n'a pas été créée :x: :x: 
                    Pour créer la commande de pizza, tapez **/createPizzaCommand**
                `);
        return;
    }

    return JSON.parse(request);
}
