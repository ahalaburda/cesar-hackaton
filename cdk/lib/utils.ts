
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";


export async function getParameter(parameterName: string): Promise<string|null> {
    const ssmClient = new SSMClient();
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });
    let response = null;
    try {
      response = await ssmClient.send(command);
      return response.Parameter!.Value!;
    } catch (error) {
      throw new Error("No SSM Get Parameter found: "+ parameterName);
    }
}

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