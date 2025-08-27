
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";


export async function getSecret(secretId: string): Promise<string|null> {
    const secretsManager = new SecretsManagerClient();
    const command = new GetSecretValueCommand({SecretId: secretId});
    let response = null;
    try {
        const req = await secretsManager.send(command);
        response = req.SecretString || null;
    } catch (error) {
        throw new Error("No Secret found: "+ secretId);
    }
    return response || null;
}